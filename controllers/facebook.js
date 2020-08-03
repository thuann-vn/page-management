const graph = require('fbgraph');
const Page = require('../models/Pages');
const { urlencoded } = require('body-parser');
const Thread = require('../models/Threads');
const { pusher } = require('../services/pusher');
const Message = require('../models/Messages');
const { MessageTypes } = require('../constants');
const Post = require('../models/Post');
const Customer = require('../models/Customer');

exports.pages = async (req, res) => {
  this.getFacebookToken(req);
  graph.get(`${req.user.facebook}/accounts`, (err, pages) => {
    res.json(pages.data);
  })
}

exports.setupPage = async (req, res, next) => {
  try{

    const page = req.body;
    pageAccessToken = await this.getPageAccessToken(page.access_token);
  
    //Create pages
    var pageData = await Page.findOne({id: page.id});
    if(!pageData){
      var pageData = new Page(page);
      pageData.user_id = req.user.id;
      pageData.access_token = pageAccessToken;
      pageData.save();  
    }
    
    //Syncs threads
    graph.setAccessToken(pageAccessToken);
    const conversations = await this.getConversations(pageData.id);
    if (conversations) {
      for (var i = 0; i < conversations.length; i++) {
        var threadData = await this.getThread(conversations[i].id);
  
        //Create customer first
        const threadUser = threadData.participants.data[0];
        const avatar = await this.getThreadAvatar(threadUser.id);
        var customerData = {
          ...threadUser,
          avatar
        }

        //Check customer
        existedCustomer = await Customer.findOne({id: customerData.id});
        if(!existedCustomer){
          Customer.create(customerData);
        }

        threadData.avatar = avatar;
        threadData.page_id = page.id;
        threadData.customer_id = customerData.id;
        Thread.findOne({ id: threadData.id }, function (err, data) {
          if (data) {
            if (data.avatar != avatar || data.snippet != threadData.snippet || data.updated_time != threadData.updated_time) {
              data.page_id = page.id;
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
  
    //Sync posts
    const posts = await this.getPosts();
    if (posts.data) {
      for (var i = 0; i < posts.data.length; i++) {
        var post = posts.data[i];
        post.page_id = page.id;
        Post.create(post);
  
        //Sync comments
        const comments = await this.getComments(post.id);
        if(comments.data){
          comments.data.map((comment) => {
            comment.post_id = post.id;
            comment.type = MessageTypes.comment;
            comment.customer_id = Comment.from.id;
            Message.create(comment);
  
            //Check customer
            Customer.findOne({id: Comment.from.id}).then(doc => {
              if(!doc){
                Customer.create(comment.from);
              }
            });
          })
        }
      }
    }
  
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
  // const pageToken = req.body.access_token;
  // const pageId = req.body.id;
  var threads = [];
  var pages = await Page.find({user_id: req.user.id});
  var pageIds = pages.map(page => page.id);

  //Try to get from database
  var isDBReturned = false;
  const data = await Thread.find({ page_id: {$in: pageIds} }).sort({ updated_time: -1 }).exec();
  return res.json(data);

  for(var pageIndex=0; i<pages.length; i++){
    var pageId = pages[pageIndex].id;
    var pageToken = pages[pageIndex].access_token;
    //Get page token
    var token = await this.getPageToken(pageId);
    if (!token) {
      return res.json({ success: false });
    }
    graph.setAccessToken(token);
    const conversations = await this.getConversations(pageId);
    if (conversations) {
      for (var i = 0; i < conversations.length; i++) {
        var threadData = await this.getThread(conversations[i].id);
        threadData.user = { ...threadData.participants.data[0] };
        const avatar = await this.getThreadAvatar(threadData.user.id);
        threadData.avatar = avatar;
        threadData.page_id = pageId;
        Thread.findOne({ id: threadData.id }, function (err, data) {
          if (data) {
            if (data.avatar != avatar || data.snippet != threadData.snippet || data.updated_time != threadData.updated_time) {
              data.page_id = pageId;
              data.avatar = avatar;
              data.snippet = threadData.snippet;
              data.updated_time = threadData.updated_time;
              data.save();
              //Push update
              if (isDBReturned) {
                pusher.trigger('notifications', 'thread.update', { data });
              }
            }
          } else {
            Thread.create(threadData, function (err, data) {
              //Push update
              if (isDBReturned) {
                pusher.trigger('notifications', 'thread.new', { data });
              }
            });
          }
        })

        delete (threadData.participants);
        threads.push(threadData);
      }
    }
  }
  res.json(threads);
};

/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.messages = async (req, res, next) => {
  // const pageToken = req.body.access_token;
  const threadId = req.query.threadId;
  const nextId = req.query.nextId;
  const pageId = '106261714466963';

  //Try to get from database
  var isDBReturned = false;
  try {
    var data = await Message.find({ thread_id: threadId }).sort({ updated_time: -1 }).exec();
    if (data && data.length) {
      isDBReturned = true;
      res.json({ data: data });
      return;
    }
  } catch (err) {
    console.error(err);
  }

  var token = await this.getPageToken(pageId);
  if (!token) {
    return res.json({ success: false });
  }
  graph.setAccessToken(token);
  const messages = await this.getThreadMessages(threadId, nextId);

  if (messages) {
    messages.forEach(message => {
      Message.findOne({ id: message.id }, function (err, data) {
        if (err || !data) {
          Message.create(message);
        }
      })
    });
  }

  res.json({ data: messages });
};

exports.syncThreadMessages = async (thread) => {
  const messages = await this.getThreadMessages(thread.id);
  if (messages) {
    messages.forEach(message => {
      Message.findOne({ id: message.id }, function (err, data) {
        if (err || !data) {
          message.thread_id = thread.id;
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
  // const pageToken = req.body.access_token;
  const thread = req.body.thread;
  const message = req.body.message;
  const pageId = '106261714466963';

  if (!message || !thread) {
    return res.json(false);
  }

  var token = await this.getPageToken(pageId);
  if (!token) {
    return res.json({ success: false });
  }
  graph.setAccessToken(token);
  var messageBody = {
    "recipient": {
      "id": thread.user.id
    },
    "message": {
      "text": message
    }
  }
  const result = await this.postThreadMessage(pageId, messageBody);
  res.json(result);
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
  const token = req.user.tokens.find((token) => token.kind === 'facebook');
  graph.setAccessToken(token.accessToken);
}

exports.getThreadMessages = async (threadId, nextId = null) => {
  var promise = new Promise((resolve) => {
    graph.get(`${nextId ? nextId : threadId}/messages?fields=sticker,message,from,created_time,tags,to,attachments,shares`, (err, result) => {
      if (err) {
        resolve([]);
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
  var page = await Page.findOne({ id: pageId });
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
        resolve(null);
      }
      resolve(result);
    });
  })

  return promise;
}

exports.getComments = (postId) => {
  var promise = new Promise((resolve) => {
    graph.get(`${postId}?fields=comments{comment_count,attachment,from,created_time,id,message,message_tags,object,permalink_url,comments}`, (err, result) => {
      if (err) {
        resolve(null);
      }
      resolve(result);
    });
  })

  return promise;
}