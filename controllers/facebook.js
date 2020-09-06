const graph = require('fbgraph');
const Page = require('../models/Pages');
const { urlencoded } = require('body-parser');
const Thread = require('../models/Threads');
const { pusher } = require('../services/pusher');
const Message = require('../models/Messages');
const { MessageTypes } = require('../constants');
const Post = require('../models/Post');
const Customer = require('../models/Customer');
const fbgraph = require('fbgraph');
const { Facebook } = require('../services/facebook');
const mongoose = require('mongoose');
const { error } = require('jquery');

exports.pages = async (req, res) => {
  this.getFacebookToken(req);
  graph.get(`${req.user.facebook}/accounts`, (err, pages) => {
    if(err){
      console.error('Get page ', err);
      res.json([]);
    }else{
      res.json(pages.data);
    }
  })
}

exports.setupPage = async (req, res, next) => {
  try{
    const page = req.body;
    const userId = mongoose.Types.ObjectId(req.user.id);
    pageAccessToken = await this.getPageAccessToken(page.access_token);
  
    //Create pages
    var pageData = await Page.findById(page.id);
    if(!pageData){
      pageData = new Page(page);
      pageData._id = page.id;
      pageData.user_id = userId;
      pageData.access_token = pageAccessToken;
      pageData.save();  
    }
    
    //Syncs threads
    await this.getThreadAndMessages(pageData, userId)
  
    //Sync posts
    await this.getPostAndComments(pageData, userId)
  
    res.json(pageData);
  }catch(err){
    next(err);
  }
}
/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.threads = async (req, res, next) => {
  var pageIds = [];
  if(req.query.page_id){
    pageIds = [req.query.page_id];
  }else{
    var pages = await Page.find({user_id: mongoose.Types.ObjectId(req.user.id)});
    pageIds = pages.map(page => page._id);
  }

  //Try to get from database
  var data = await Customer.find({ page_id: {$in: pageIds} }).sort({ updated_time: -1 }).exec();
  data = data.filter((item) =>{
    return pageIds.indexOf(item._id) == -1;
  });
  return res.json(data);
};

// Get post and commends of a page
exports.getPostAndComments = async (page, userId)=>{
  graph.setAccessToken(page.access_token);
  const posts = await this.getPosts();
  if (posts.data) {
    for (var i = 0; i < posts.data.length; i++) {
      var post = posts.data[i];
      post.page_id = page._id;
      // Post.create(post);

      //Sync comments
      const comments = await this.getComments(post._id);
      if(comments && comments.data){
        comments.data.map((comment) => {
          if(!comment.from) return;
          comment.post_id = post._id;
          comment.type = MessageTypes.comment;
          comment.customer_id = comment.from.id;
          Message.findOne({_id: comment._id}).then(doc => {
            if(!doc){
              Message.create(comment);
              return;
            }

            doc.page_id = page._id;
            doc.save();
          });

          if(comment.comment_count && comment.comments){
            comment.comments.data.map((reply)=>{
              if(!reply.from) return;
              reply.post_id = post._id;
              reply.type = MessageTypes.comment;
              reply.customer_id = reply.from._id;
              reply.comment_id = comment._id;
              Message.findById(comment._id).then(doc => {
                if(!doc){
                  Message.create(reply);
                  return;
                }

                doc.page_id = page._id;
                doc.save();
              });


              //Check customer
              Customer.findById(reply.from.id).then(doc => {
                if(!doc){
                  var customer = {
                    ...comment.from,
                    user_id: userId,
                    page_id: page._id,
                    last_update: comment.created_time
                  }
                  Customer.create(customer);
                }
              });
            })
          }

          //Check customer
          Customer.findById(comment.from.id).then(doc => {
            if(!doc){
              var customer = {
                ...comment.from,
                _id: comment.from.id,
                user_id: userId,
                page_id: page._id,
                last_update: comment.created_time
              }
              Customer.create(customer);
            }
          });
        })
      }
    }
  }
}

//Get Thread and messages
exports.getThreadAndMessages = async (page, userId) =>{
  graph.setAccessToken(page.access_token);
  const conversations = await this.getConversations(page._id);
  if (conversations) {
    for (var i = 0; i < conversations.length; i++) {
      var threadData = await this.getThread(conversations[i].id);
      console.log('RUNNING THREAD', threadData);
      //Create customer first
      const threadUser = threadData.participants.data[0];
      const avatar = await this.getThreadAvatar(threadUser.id);
      var customerData = {
        ...threadUser,
        _id: threadUser.id,
        avatar,
        user_id: userId,
        page_id: page._id,
        snippet: threadData.snippet,
        last_update: threadData.updated_time
      }

      //Check customer
      existedCustomer = await Customer.findById(customerData._id);
      if(!existedCustomer){
        Customer.create(customerData);
      }

      threadData._id = threadData.id;
      threadData.avatar = avatar;
      threadData.page_id = page._id;
      threadData.customer_id = customerData._id;
      Thread.findById(threadData._id, function (err, data) {
        if (!err && data) {
          if (data.avatar != avatar || data.snippet != threadData.snippet || data.updated_time != threadData.updated_time) {
            data.page_id = page._id;
            data.avatar = avatar;
            data.snippet = threadData.snippet;
            data.updated_time = threadData.updated_time;
            data.save();
          }
        } else {
          Thread.create(threadData, function (err, data) {});
        }
      })

      //Sync message 
      await this.syncThreadMessages(threadData);
    }
  }
}

/**
 * GET /api/facebook/messages
 * Facebook API example.
 */
exports.messages = async (req, res, next) => {
  // const pageToken = req.body.access_token;
  const customerId = req.query.threadId;
  const page = req.query.page || 1;
  const pageSize = 30;

  // Try to get from database
  try {
    var conditions = { customer_id: customerId };
    var total = await Message.countDocuments(conditions);
    console.log(conditions);
    var data = await Message.find(conditions).sort({ created_time: 1 }).limit(pageSize).skip(pageSize * (page-1)).exec();
    if (data && data.length) {
      res.json({ data: data, total: total  });
      return;
    }
    res.json({ data: [], total: total });
  } catch (err) {
    console.log(err);
  }
};

exports.syncThreadMessages = async (thread) => {
  const messages = await this.getThreadMessages(thread._id);
  if (messages) {
    messages.forEach(message => {
      Message.findById(message.id, function (err, data) {
        if (err || !data) {
          message._id = message.id;
          message.thread_id = thread._id;
          message.customer_id = thread.customer_id;
          message.type = MessageTypes.chat;
          Message.create(message);
        }
      })
    });
  }
  return messages;
}


/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.postMessage = async (req, res, next) => {
  const customer = req.body.thread;
  const message = req.body.message;
  const uuid = req.body.uuid;
  const pageId = customer.page_id;
  const customerId = customer.id;
  console.log('POST MESSAGE', req.body);

  if (!message || !customer) {
    return res.json(false);
  }

  var token = await this.getPageToken(pageId);
  if (!token) {
    console.log('GET TOKEN ERROR', token);
    return res.json({ success: false });
  }
  var messageBody = {
    "recipient": {
      "id": customerId
    },
    "message": {
      "text": message
    }
  }

  graph.setAccessToken(token);
  graph.post(`${pageId}/messages`, messageBody, (err, result) => {
    if (err) {
      console.error(err);
      next(err);
      return;
    }

    console.log('POST RESULT', result);

    Facebook.getThreadByUserId(token, customerId).then(function (thread) {//Check if thread is existed
      Thread.findOne({ id: thread._id }, function (err, data) {
        if (err || !data) {
          thread.page_id = page._id;
          thread.customer_id = customerId;

          Thread.create({
            ...thread
          });

          pusher.trigger('notifications', 'thread.add', { thread });
        } else {
          data.updated_time = thread.updated_time;
          data.snippet = thread.snippet;
          data.unread_count = thread.unread_count;
          pusher.trigger('notifications', 'thread.update', data);
          data.save();
        }
      })

      //Get message detail
      Facebook.getMessageById(token, result.message_id).then((data)=>{
        var messageData = {
          ...data,
          customer_id: customerId,
          page_id: pageId,
          thread_id: thread._id,
          type: MessageTypes.chat,
          uuid: uuid
        } 
        Message.create(messageData);
    
        res.json({success: true, data:messageData});
      })
    });
  });
};

exports.getPageAccessToken = async (pageToken) => {
  var extendAccessTokenParams = {
    access_token: pageToken,
    client_id: process.env.FACEBOOK_ID,
    client_secret: process.env.FACEBOOK_SECRET,
  };

  var promise = new Promise((resolve) => {
    graph.extendAccessToken(extendAccessTokenParams, (err, token) => {
      if (err) {
        resolve(null);
      }

      resolve(token.access_token);
    });
  })

  return promise;
}


exports.getConversations = async () => {
  var promise = new Promise((resolve) => {
    graph.get(`me?fields=conversations`, (err, result) => {
      if (err || result.error) {
        resolve(null);
        return;
      }
      resolve(result.conversations ? result.conversations.data : []);
    });
  })

  return promise;
}


exports.getThread = async (threadId) => {
  var promise = new Promise((resolve) => {
    graph.get(`${threadId}?fields=unread_count,participants,is_subscribed,snippet,updated_time`, (err, result) => {
      if (err) {
        resolve(null);
      }
      resolve(result);
    });
  })

  return promise;
}

exports.getFacebookToken = (req) => {
  console.log(req.user.tokens);
  const token = req.user.tokens.find((token) => token.kind === 'facebook');
  graph.setAccessToken(token.accessToken);
}

exports.getThreadMessages = async (threadId, nextId = null) => {
  var promise = new Promise((resolve) => {
    graph.get(`${nextId ? nextId : threadId}/messages?fields=sticker,message,from,created_time,tags,to,attachments,shares`, (err, result) => {
      if (err) {
        resolve([]);
        return;
      }
      if (result.data) {
        result.data = result.data.reverse();

        result.data.map(message => {
          message.thread_id = threadId;
          if (message.to && message.to.data) {
            message.to = message.to.data[0]
          }
          if (message.tags && message.tags.data) {
            message.tags = message.tags.data
          }
          message.type = MessageTypes.chat;
          return message;
        })
      }
      resolve(result.data);
    });
  })

  return promise;
}

exports.getPageToken = async (pageId) => {
  //Get page token
  var page = await Page.findById(pageId);
  if (!page) {
    return null;
  }

  return page.access_token;
}

exports.postThreadMessage = async (pageId, message = null) => {
  if (message) {
    var promise = new Promise((resolve) => {
      graph.post(`${pageId}/messages`, message, (err, result) => {
        if (err) {
          resolve(err);
          return;
        }
        resolve(result);
      });
    })

    return promise;
  }
}

exports.getThreadAvatar = (userId) => {
  var promise = new Promise((resolve) => {
    graph.get(`${userId}`, (err, result) => {
      if (err) {
        resolve('');
        return;
      }
      resolve(result.profile_pic);
    });
  })

  return promise;
}

exports.getPosts = () => {
  var promise = new Promise((resolve) => {
    graph.get(`me/feed?fields=attachments,created_time,full_picture,message,picture,status_type`, (err, result) => {
      if (err) {
        return resolve(null);
      }
      resolve(result);
    });
  })

  return promise;
}

exports.getComments = (postId) => {
  var promise = new Promise((resolve) => {
    graph.get(`${postId}?fields=comments{comment_count,attachment,from,created_time,id,message,message_tags,object,permalink_url,comments}`, (err, result) => {
      if (err || !result) {
        return resolve(null);
      }
      resolve(result.comments);
    });
  })

  return promise;
}