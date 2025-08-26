chrome.runtime.onInstalled.addListener(function (details) {
  try {
    const thisVersion = chrome.runtime.getManifest().version;

    if (details.reason === "install") {
      console.info("First version installed");
    } else if (details.reason === "update") {
      console.info("Updated version: " + thisVersion);

      chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        tabs.forEach(tab => {
          if (tab.url && tab.url.includes("extremelot.eu/lotnew/_index2.htm")) {
            chrome.tabs.sendMessage(tab.id, {
              name: "showPopupOnUpdated",
              version: thisVersion
            }, function (response) {
              if (chrome.runtime.lastError) {
                console.warn("Nessun content script in ascolto:", chrome.runtime.lastError.message);
              }
            });
          } else {
            console.warn("Tab attiva non valida per l'estensione:", tab.url);
          }
        });
      });
    }
  } catch (e) {
    console.error("OnInstall Error:", e);
  }
});
