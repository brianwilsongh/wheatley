function processGreetings(items){
  for (var idx = 0; idx < items.length; idx++){
    var item = items[idx];
    if (item.confidence >= 0.85) { 
      return {text: "Why hello there!"};
    } else {
      return {text: "...huh?"};
    }
  }
}

function processDateTimes(items){
  for (let item in items){
    if (item.confidence > 0.80) return {text: item.value + " is the date I got"});
  }
}