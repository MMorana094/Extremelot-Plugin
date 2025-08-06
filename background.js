chrome.runtime.onInstalled.addListener(function (details) {
  try {
    var thisVersion = chrome.runtime.getManifest().version;
    if (details.reason == "install") {
      console.info("First version installed");
      //Send message to popup.html and notify/alert user("Benvenuto")
    } else if (details.reason == "update") {
      console.info("Updated version: " + thisVersion);
      //Send message to popup.html and notify/alert user

      chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        for( var i = 0; i < tabs.length; i++ ) {
            chrome.tabs.sendMessage(tabs[i].id, {name: "showPopupOnUpdated", version: thisVersion});
        }
        });
    }
  } catch(e) {
    console.info("OnInstall Error - " + e);
  }
});