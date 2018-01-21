'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');

const entities = require('./app_modules/entities.js');

const app = express();
const env = process.env;

const PAGE_ACCESS_TOKEN = env.WHEATLEY_FB_PAGE_ACCESS_TOKEN; //big string
const VERIFY_TOKEN = env.WHEATLEY_FB_VERIFY_TOKEN; //random string
console.log("PAGE_ACCESS_TOKEN set as : " + PAGE_ACCESS_TOKEN);
console.log("VERIFY_TOKEN set: " + VERIFY_TOKEN);

app.set('port', (process.env.PORT || 5000)); //set to 5k if not given

//to process data
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//routes

app.get('/', function(req, res) {
  res.send("Hello World.");
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

app.post('/webhook', (req, res) => {  
  // Parse the request body from the POST
  let body = req.body;
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      //Get the sender psid
      let sender_psid = webhook_event.sender.id;
      
      //Check if the event is a message or postback and pass event to appropriate handler
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback){
        handlePostback(sender_psid, webhook_event.postback);
      }
      
      console.log("entry stringified: " + JSON.stringify(entry));
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


// Handles messages events
function handleMessage(sender_psid, received_message) {
  //psid in this handler functions are page-scoped ids

  let response;
  //check if msg contains text
  let entitiesObj = received_message.nlp.entities;
  if (Object.keys(entitiesObj).length > 0){
    for (let entity in entitiesObj){
      let items = entitiesObj[entity];
      console.log("entitiesObj[entity] = ", items);
      if (entity === "greetings") callSendAPI(sender_psid, entities.processGreetings(items));
      if (entity === "datetime") callSendAPI(sender_psid, entities.processDateTimes(items));
    }
  } else if (received_message.text){
    //create the payload for a basic txt message
    let txt = received_message.text.toLowerCase();
    if (txt.includes("long island", "stonybrook", "stony brook")){
      response = {text : "Shut up."};
    } 
     if (txt.includes("saber", "one piece")){
      response = {text : "Is that you, Sharif?"};
    } else {
      response = {text : `you sent the message "${received_message.text}". Now send a picture with you in it!`};
    }
  } else if (received_message.attachments){
    //gets URL of message attachment 
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment : {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Does Brian know this person?",
            subtitle: "Tap a button to answer.",
            image_url: attachment_url,
            buttons: [
              {
                type: "postback",
                title: "Yes!",
                payload: "yes",
              }, 
              {
                type: "postback",
                title: "No!",
                payload: "no",
              }
            ]
          }]
        }
      }
    };
  }
  //sends the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events (when user uses a button for example to send string)
function handlePostback(sender_psid, received_postback) {
  let response;
  //get payload for the postback 
  let payload = received_postback.payload;
  if (payload === 'yes'){
    response = {text: "Cool, I'll remember that information... or not."};
  } else if (payload === 'no'){
    response = {text: "It's always a good time to make new friends."};
  }
  //send msg to acknowledge the postback 
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  //construct the msg body
  let request_body = {
    recipient : {
      id : sender_psid
    }, 
    message : response
  };
  
  //send the HTTP req to FB messenger platform req 
  request({
    uri : "https://graph.facebook.com/v2.6/me/messages",
    qs : {
      access_token : PAGE_ACCESS_TOKEN
    }, 
    method : "POST",
    json : request_body
  }, (err, res, body) => {
    if (!err){
      console.log("message sent!");
    } else {
      console.error("Failed to send message " + response + " , error: " + err);
    }
  });
}

app.listen(app.get('port'), function(){
  console.log("Chatty started on port " + app.get('port'));
});

app.get('/privacy', function(req, res){
  res.sendFile(path.join(__dirname+'/privacy.html'));
});













