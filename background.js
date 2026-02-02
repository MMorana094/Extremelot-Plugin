// background.js (MV3 service worker)

// =============================
// onInstalled (unchanged logic)
// =============================
chrome.runtime.onInstalled.addListener(function (details) {
  try {
    const thisVersion = chrome.runtime.getManifest().version;

    if (details.reason === "install") {
      console.info("First version installed");
      return;
    }

    if (details.reason === "update") {
      console.info("Updated version: " + thisVersion);

      // PATCH: query meno rigida (www + non-www + qualunque pagina in /lotnew/)
      chrome.tabs.query(
        { url: ["*://www.extremelot.eu/lotnew/*", "*://extremelot.eu/lotnew/*"] },
        function (tabs) {
          if (!tabs || tabs.length === 0) {
            console.warn("Nessuna tab LOT aperta al momento dell'update");
            return;
          }

          tabs.forEach((tab) => {
            if (!tab?.id) return;

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

// ============================================
// Message bridge (MAIN world + tab open helper)
// ============================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (!msg || typeof msg !== "object") return;

    // -------------------------
    // 1) OPEN_TAB (NEW)
    // -------------------------
    if (msg.type === "OPEN_TAB") {
      const url = String(msg.url || "").trim();
      if (!url) {
        sendResponse && sendResponse({ ok: false, error: "missing url" });
        return true;
      }

      const active = msg.active !== false; // default true
      const reuseSenderTab = !!msg.reuseSenderTab;
      const senderTabId = sender?.tab?.id;

      if (reuseSenderTab && senderTabId) {
        chrome.tabs.update(senderTabId, { url, active }, () => {
          if (chrome.runtime.lastError) {
            sendResponse &&
              sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse && sendResponse({ ok: true, reused: true });
          }
        });
        return true;
      }

      chrome.tabs.create({ url, active }, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse &&
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse && sendResponse({ ok: true, tabId: tab?.id });
        }
      });
      return true;
    }

    // -------------------------
    // 2) OPEN_POPUP (optional)
    // -------------------------
    if (msg.type === "OPEN_POPUP") {
      const url = String(msg.url || "").trim();
      if (!url) {
        sendResponse && sendResponse({ ok: false, error: "missing url" });
        return true;
      }

      const width = Number(msg.width || 900);
      const height = Number(msg.height || 550);

      const left = Number.isFinite(Number(msg.left)) ? Number(msg.left) : undefined;
      const topPos = Number.isFinite(Number(msg.top)) ? Number(msg.top) : undefined;

      chrome.windows.create(
        {
          url,
          type: "popup",
          width,
          height,
          left,
          top: topPos,
          focused: true
        },
        (win) => {
          if (chrome.runtime.lastError) {
            sendResponse &&
              sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse && sendResponse({ ok: true, windowId: win?.id });
          }
        }
      );
      return true;
    }

    // ---------------------------------------------------------
    // 3) EP_OPEN_JQ_DIALOG (existing, kept + hardened)
    // ---------------------------------------------------------
    // { type: "EP_OPEN_JQ_DIALOG", id: "postaLot" }
    if (msg.type === "EP_OPEN_JQ_DIALOG") {
      const tabId = sender?.tab?.id;
      const id = String(msg.id || "").trim();

      if (!tabId || !id) {
        sendResponse && sendResponse({ ok: false, error: "missing tabId or id" });
        return true;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          args: [id],
          func: (dialogId) => {
            try {
              const $ = window.jQuery;
              if (!$) return { ok: false, reason: "no_jquery" };

              const sel = "#dlg-" + dialogId;
              const dlg = $(sel);

              if (!dlg || !dlg.length) return { ok: false, reason: "not_found", sel };
              if (typeof dlg.dialog !== "function")
                return { ok: false, reason: "no_dialog_fn", sel };

              dlg.dialog("open");
              return { ok: true, sel };
            } catch (e) {
              return { ok: false, reason: "exception", error: String(e) };
            }
          }
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse &&
              sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            const r = results?.[0]?.result;
            sendResponse && sendResponse(r || { ok: false, reason: "no_result" });
          }
        }
      );

      return true; // async response
    }

    // se non è un messaggio gestito, non rispondiamo
    return;
  } catch (e) {
    console.error("[background] onMessage error:", e);
    sendResponse && sendResponse({ ok: false, error: String(e) });
    return true;
  }
});
