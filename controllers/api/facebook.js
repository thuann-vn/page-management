const graph = require('fbgraph');
const Quickbooks = require('node-quickbooks');
const passport = require('passport');

Quickbooks.setOauthVersion('2.0');

/**
 * GET /api/facebook/threads
 * Facebook API example.
 */
exports.threads = async (req, res, next) => {
  const pageToken = req.body.access_token;
  const pageId = req.body.id;
  var extendAccessTokenParams = {
    access_token: pageToken,
    client_id: process.env.FACEBOOK_ID,
    client_secret: process.env.FACEBOOK_SECRET,
  }; 

  const token = await this.getPageAccessToken(pageToken);
  graph.setAccessToken(token.access_token);

  const conversations = await this.getConversations(pageId);
  
  var threads = [];
  for(var i=0; i< conversations.length; i++){
    var threadData = await this.getThread(conversations[i].id);
    threadData.user = {...threadData.participants.data[0]};
    delete(threadData.participants);
    threads.push(threadData);
  }

  res.json(threads);
};

exports.getPageAccessToken = async (pageToken)=>{
  var extendAccessTokenParams = {
    access_token: pageToken,
    client_id: process.env.FACEBOOK_ID,
    client_secret: process.env.FACEBOOK_SECRET,
  }; 

  var promise = new Promise((resolve) => {
    graph.extendAccessToken(extendAccessTokenParams, (err, token)=>{
      if(err){
        resolve(null);
      }
      resolve(token);
    });
  })
  
  return promise;
}


exports.getConversations = async (pageId)=>{
  var promise = new Promise((resolve) => {
    graph.get(`${pageId}?fields=conversations`, (err, result)=>{
      if(err){
        resolve(null);
      }
      resolve(result.conversations.data);
    });
  })
  
  return promise;
}

exports.getThread = async (threadId)=>{
  var promise = new Promise((resolve) => {
    graph.get(`${threadId}?fields=unread_count,participants,is_subscribed,snippet,updated_time`, (err, result)=>{
      if(err){
        resolve(null);
      }
      resolve(result);
    });
  })

  return promise;
}
