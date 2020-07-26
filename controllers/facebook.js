const graph = require('fbgraph');
const Page = require('../models/Pages');

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
  // const pageToken = req.body.access_token;
  // const pageId = req.body.id;
  const pageId = '106261714466963';

  //Get page token
  var token = await this.getPageToken(pageId);
  console.log(token);
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
      delete (threadData.participants);
      threads.push(threadData);
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
  
  var token = await this.getPageToken(pageId);
  console.log(token);
  if(!token){
    return res.json({success: false});
  }
  graph.setAccessToken(token);
  const messages = await this.getThreadMessages(threadId, nextId);

  res.json(messages);
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
        resolve(null);
      }
      if(result.data){
        result.data = result.data.reverse();
      }
      resolve(result);
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