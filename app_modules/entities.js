function processGreetings(sender_psid, items){
  console.log("processGreetings.items = " + JSON.stringify(items));
  for (var idx = 0; idx < items.length; idx++){
    var item = items[idx];
    console.log("processGreetings.item = " + JSON.stringify(item));
    if (item.confidence >= 0.85) { 
      callSendAPI(sender_psid, {text: "Why hello there!"});
    } else {
      console.log("greeting but not confident in it");
      callSendAPI(sender_psid, {text: "...huh?"});
    }
  }
}

function processDateTimes(sender_psid, items){
  for (let item in items){
    if (item.confidence > 0.80) callSendAPI(sender_psid, (item.value + " is the date I got"));
  }
}