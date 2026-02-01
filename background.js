chrome.runtime.onInstalled.addListener(function (details) {
  try {
    const thisVersion = chrome.runtime.getManifest().version;

    if (details.reason === "install") {
      console.info("First version installed");
      return;
    }

    if (details.reason === "update") {
      console.info("Updated version: " + thisVersion);

      chrome.tabs.query(
        { url: "https://www.extremelot.eu/lotnew/_index2.asp" },
        function (tabs) {
          if (!tabs || tabs.length === 0) {
            console.warn("Nessuna tab LOT aperta al momento dell'update");
            return;
          }

          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              name: "showPopupOnUpdated",
              version: thisVersion
            }, function () {
              if (chrome.runtime.lastError) {
                console.warn("Nessun content script in ascolto:", chrome.runtime.lastError.message);
              }
            });
          });
        }
      );
    }
  } catch (e) {
    console.error("OnInstall Error:", e);
  }
});
