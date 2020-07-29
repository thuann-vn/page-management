const graph = require('fbgraph');
const Page = require('../models/Pages');
const { urlencoded } = require('body-parser');
const Thread = require('../models/Threads');
const { pusher } = require('../services/pusher');
const Message = require('../models/Messages');

exports.pages = async (req, res) => {
  const token = req.user.tokens.find((token) => token.kind === 'facebook');
  graph.setAccessToken(token.accessToken);
  graph.get(`${req.user.facebook}/accounts`, (err, pages) => {
    pages = pages.data;
    pages.map(function (page) {
      var pageData = new Page(page);
      pageData.userId = req.user.id;
      pageData.save();
    })
    res.json(pages.data);
  })
}

exports.setupPage = async (req, res) => {
  this.getFacebookToken(req);

  graph.get(`${req.user.facebook}/accounts`, (err, pages) => {
    pages = pages.data;
    pages.map(function (page) {
      var pageData = new Page(page);
      pageData.userId = req.user.id;
      pageData.save();
    })
    res.json(pages.data);
  })
}
/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.threads = async (req, res, next) => {
  var self = this;
  // const pageToken = req.body.access_token;
  // const pageId = req.body.id;
  const pageId = '106261714466963';

  //Try to get from database
  var isDBReturned = false;
  Thread.find({page_id: pageId}).sort({updated_time: -1}).exec(function(err, data){
    console.log(data);
    if(data && data.length){
      isDBReturned = true;
      res.json(data);
    }
  })

  //Continue to get token

  //Get page token
  var token = await this.getPageToken(pageId);
  if(!token){
    return res.json({success: false});
  }
  graph.setAccessToken(token);
  const conversations = await this.getConversations(pageId);
  var threads = [];
  if(conversations){
    for (var i = 0; i < conversations.length; i++) {
      var threadData = await this.getThread(conversations[i].id);
      threadData.user = { ...threadData.participants.data[0] };
      const avatar = await self.getThreadAvatar(threadData.user.id);
      threadData.avatar = avatar;
      threadData.page_id = pageId;
      Thread.findOne({id: threadData.id}, function(err, data){
        if(data){
          if(data.avatar != avatar || data.snippet != threadData.snippet || data.updated_time != threadData.updated_time){
            data.page_id = pageId;
            data.avatar = avatar;
            data.snippet = threadData.snippet;
            data.updated_time = threadData.updated_time;
            data.save();
            //Push update
            if(isDBReturned){
              pusher.trigger('notifications', 'thread.update', {data});
            }
          }
        }else{
          Thread.create(threadData, function(err, data){
            //Push update
            if(isDBReturned){
              pusher.trigger('notifications', 'thread.new', {data});
            }
          });
        }
      })

      delete (threadData.participants);
      threads.push(threadData);
    }
  }

  if(!isDBReturned){
    res.json(threads);
  }
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
    var data = await Message.find({thread_id: threadId}).sort({updated_time: -1}).exec();
    if(data && data.length){
      isDBReturned = true;
      res.json({data: data});
      return;
    }
  } catch (err) {
    console.error(err);
  }

  var token = await this.getPageToken(pageId);
  if(!token){
    return res.json({success: false});
  }
  graph.setAccessToken(token);
  const messages = await this.getThreadMessages(threadId, nextId);

  if(messages){
    messages.forEach(message => {
      Message.findOne({id:message.id}, function(err, data){
        if(err || !data){
          Message.create(message);
        }
      })
    });
  }

  res.json({data: messages});
};


/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.postMessage = async (req, res, next) => {
  // const pageToken = req.body.access_token;
  const thread = req.body.thread;
  const message = req.body.message;
  const pageId = '106261714466963';

  if(!message || !thread){
    return res.json(false);
  }
  
  var token = await this.getPageToken(pageId);
  if(!token){
    return res.json({success: false});
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

      resolve(token);
    });
  })

  return promise;
}


exports.getConversations = async (pageId) => {
  var promise = new Promise((resolve) => {
    graph.get(`${pageId}?fields=conversations`, (err, result) => {
      if (err || result.error) {
        resolve(null);
        return;
      }
      resolve(result.conversations.data);
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
      if(result.data){
        result.data = result.data.reverse();

        result.data.map(message =>{
          message.thread_id = threadId;
          if(message.to && message.to.data){
            message.to = message.to.data[0]
          }
          if(message.tags && message.tags.data){
            message.tags = message.tags.data
          }
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
   var page = await Page.findOne({id: pageId});
   if(!page){
     return null;
   }

   return page.access_token;
}

exports.postThreadMessage = async (pageId, message = null) => {
  if(message){
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