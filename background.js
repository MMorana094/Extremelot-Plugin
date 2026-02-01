// background.js (MV3 service worker)

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
            chrome.tabs.sendMessage(
              tab.id,
              {
                name: "showPopupOnUpdated",
                version: thisVersion
              },
              function () {
                if (chrome.runtime.lastError) {
                  console.warn(
                    "Nessun content script in ascolto:",
                    chrome.runtime.lastError.message
                  );
                }
              }
            );
          });
        }
      );
    }
  } catch (e) {
    console.error("OnInstall Error:", e);
  }
});

/**
 * Bridge: esegue codice nel MAIN world della tab (CSP-safe per LOT)
 * Usato per forzare l'apertura di dialog jQuery UI già creati da LOT, es: #dlg-postaLot
 *
 * Messaggio atteso dal content script:
 *  { type: "EP_OPEN_JQ_DIALOG", id: "postaLot" }
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (!msg || msg.type !== "EP_OPEN_JQ_DIALOG") return;

    const tabId = sender && sender.tab && sender.tab.id;
    const id = String(msg.id || "").trim();

    if (!tabId || !id) {
      sendResponse && sendResponse({ ok: false, error: "missing tabId or id" });
      return true;
    }

    // Esegui nel MAIN world: qui window.jQuery è accessibile
    chrome.scripting.executeScript(
      {
        target: { tabId },
        world: "MAIN",
        args: [id],
        func: (dialogId) => {
          try {
            const $ = window.jQuery;
            if (!$) return;

            const sel = "#dlg-" + dialogId;
            const dlg = $(sel);

            if (dlg && dlg.length && typeof dlg.dialog === "function") {
              dlg.dialog("open");
            }
          } catch (_) {}
        }
      },
      () => {
        // Non è un errore “grave” se fallisce: dipende dal contesto tab/frame
        if (chrome.runtime.lastError) {
          sendResponse &&
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse && sendResponse({ ok: true });
        }
      }
    );

    return true; // async response
  } catch (e) {
    console.error("[EP_OPEN_JQ_DIALOG] error:", e);
    sendResponse && sendResponse({ ok: false, error: String(e) });
    return true;
  }
});
