const graph = require('fbgraph');
const Page = require('../models/Pages');
const WebHook = require('../models/WebHook');
const { pusher } = require('../services/pusher');
const User = require('../models/User');
const Message = require('../models/Messages');
const { Facebook } = require('../services/facebook');
const { threads } = require('./facebook');
const Thread = require('../models/Threads');

exports.verifyWebhook = async (req, res) => {
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "THUANGUYEN";

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

exports.receivedWebhook = async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  const webHook = new WebHook();
  webHook.body = body;
  webHook.save((err) => {
    if (err) {
      console.log('Save webhook failed', err);
    }
  });

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      if(entry.messaging && entry.messaging.length){
        let webhook_event = entry.messaging[0];
        if(!webhook_event.message || !webhook_event.message.mid){
          return;
        }
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        Page.findOne({id: {$in: [webhook_event.sender.id, webhook_event.recipient.id]}}, function(err, page){
          if(!err && page){
            Facebook.getThreadByUserId(page.access_token, page.id == webhook_event.recipient.id ? webhook_event.sender.id: webhook_event.recipient.id).then(function(thread){
              //Check if thread is existed
              Thread.findOne({id: thread.id}, function(err, data){
                  if(err || !data){
                    thread.page_id = page.id;
                    Thread.create({
                      ...thread
                    });

                    pusher.trigger('notifications', 'thread.add', {thread});
                  }else{
                    data.updated_time = thread.updated_time;
                    data.snippet = thread.snippet;
                    data.unread_count = thread.unread_count;
                    pusher.trigger('notifications', 'thread.update', data);
                    data.save();
                  }
              })
              
              Facebook.getMessageById(page.access_token, webhook_event.message.mid).then(function(message){
                message.thread_id = thread.id;
                message.page_id = page.id;
                pusher.trigger('notifications', 'message.new', {thread, message});

                Thread.findOne({id: message.id}, function(err, data){
                  if(err || !data){
                    Message.create({
                      ...message
                    }, function(err){
                      if(err){
                        console.error(err);
                      }
                    })
                  }
              })
              })
            })
          }
        });

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
  
          handlePostback(sender_psid, webhook_event.postback);
        }
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Alway return 200
    res.sendStatus(200);
  }

}


function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `You sent the message: "${received_message.text}". Now send me an attachment!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  console.log('message sent!', request_body);
  return;
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}
