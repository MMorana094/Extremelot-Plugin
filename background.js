// background.js (MV3 service worker)

// ============================================
// INSTALL TRACKING (admin only)
// ============================================
const EP_TRACKING_ENABLED = true;

// URL reali (Altervista corretto)
const EP_HEARTBEAT_URL =
  "https://colossus.altervista.org/PluginLot/api/heartbeat.php";
const EP_UNINSTALL_URL_BASE =
  "https://colossus.altervista.org/PluginLot/api/uninstall.php";

// Alarm config
const EP_HEARTBEAT_ALARM = "ep_heartbeat_v1";
const EP_HEARTBEAT_EVERY_MIN = 60;

// Storage keys
const EP_INSTALL_ID_KEY = "ep_install_id";
const EP_INSTALL_CREATED_KEY = "ep_install_created";
const EP_LAST_HEARTBEAT_KEY = "ep_last_heartbeat";

function epNowIso() {
  return new Date().toISOString();
}

async function epGetOrCreateInstallId() {
  const data = await chrome.storage.local.get([
    EP_INSTALL_ID_KEY,
    EP_INSTALL_CREATED_KEY
  ]);

  if (data?.[EP_INSTALL_ID_KEY]) return data[EP_INSTALL_ID_KEY];

  let id = "";
  try {
    id = crypto?.randomUUID?.() || "";
  } catch (_) {}

  if (!id) id = Date.now() + "_" + Math.random().toString(16).slice(2);

  await chrome.storage.local.set({
    [EP_INSTALL_ID_KEY]: id,
    [EP_INSTALL_CREATED_KEY]: epNowIso()
  });

  // uninstall ping (best effort)
  try {
    chrome.runtime.setUninstallURL(
      `${EP_UNINSTALL_URL_BASE}?id=${encodeURIComponent(id)}`
    );
  } catch (_) {}

  return id;
}

function epEnsureAlarm() {
  try {
    chrome.alarms.create(EP_HEARTBEAT_ALARM, {
      periodInMinutes: EP_HEARTBEAT_EVERY_MIN
    });
  } catch (e) {
    console.warn("[tracking] alarms unavailable", e);
  }
}

async function epSendHeartbeat(reason) {
  if (!EP_TRACKING_ENABLED) return;

  try {
    const installId = await epGetOrCreateInstallId();
    const version = chrome.runtime.getManifest().version;

    await fetch(EP_HEARTBEAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        installId,
        version,
        reason: reason || "heartbeat",
        ts: epNowIso()
      })
    });

    await chrome.storage.local.set({
      [EP_LAST_HEARTBEAT_KEY]: epNowIso()
    });
  } catch (_) {
    // volutamente silenzioso
  }
}

// =============================
// onInstalled (TUO CODICE + tracking)
// =============================
chrome.runtime.onInstalled.addListener(function (details) {
  try {
    // tracking
    epEnsureAlarm();
    epSendHeartbeat(details?.reason || "installed").catch(() => {});

    const thisVersion = chrome.runtime.getManifest().version;

    if (details.reason === "install") {
      console.info("First version installed");
      return;
    }

    if (details.reason === "update") {
      console.info("Updated version: " + thisVersion);

      chrome.tabs.query(
        { url: ["*://www.extremelot.eu/lotnew/*", "*://extremelot.eu/lotnew/*"] },
        function (tabs) {
          if (!tabs || tabs.length === 0) return;

          tabs.forEach((tab) => {
            if (!tab?.id) return;
            
            chrome.tabs.sendMessage(
              tab.id,
              { name: "showPopupOnUpdated", version: thisVersion },
              function () {
                // evita "Unchecked runtime.lastError" quando non c'è un receiver
                if (chrome.runtime.lastError) return;
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

// =============================
// onStartup (tracking)
// =============================
chrome.runtime.onStartup.addListener(() => {
  try {
    epEnsureAlarm();
    epSendHeartbeat("startup").catch(() => {});
  } catch (_) {}
});

// =============================
// alarms (tracking)
// =============================
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm?.name === EP_HEARTBEAT_ALARM) {
    epSendHeartbeat("alarm").catch(() => {});
  }
});

// ============================================
// MESSAGE BRIDGE (TUO CODICE INALTERATO)
// ============================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (!msg || typeof msg !== "object") return;

    // OPEN_TAB
    if (msg.type === "OPEN_TAB") {
      const url = String(msg.url || "").trim();
      if (!url) {
        sendResponse({ ok: false, error: "missing url" });
        return true;
      }

      const active = msg.active !== false;
      const reuseSenderTab = !!msg.reuseSenderTab;
      const senderTabId = sender?.tab?.id;

      if (reuseSenderTab && senderTabId) {
        chrome.tabs.update(senderTabId, { url, active }, () => {
          sendResponse(
            chrome.runtime.lastError
              ? { ok: false, error: chrome.runtime.lastError.message }
              : { ok: true, reused: true }
          );
        });
        return true;
      }

      chrome.tabs.create({ url, active }, (tab) => {
        sendResponse(
          chrome.runtime.lastError
            ? { ok: false, error: chrome.runtime.lastError.message }
            : { ok: true, tabId: tab?.id }
        );
      });
      return true;
    }

    // OPEN_POPUP
    if (msg.type === "OPEN_POPUP") {
      const url = String(msg.url || "").trim();
      if (!url) {
        sendResponse({ ok: false, error: "missing url" });
        return true;
      }

      chrome.windows.create(
        {
          url,
          type: "popup",
          width: Number(msg.width || 900),
          height: Number(msg.height || 550),
          left: Number.isFinite(Number(msg.left)) ? Number(msg.left) : undefined,
          top: Number.isFinite(Number(msg.top)) ? Number(msg.top) : undefined,
          focused: true
        },
        (win) => {
          sendResponse(
            chrome.runtime.lastError
              ? { ok: false, error: chrome.runtime.lastError.message }
              : { ok: true, windowId: win?.id }
          );
        }
      );
      return true;
    }

    // EP_OPEN_JQ_DIALOG
    if (msg.type === "EP_OPEN_JQ_DIALOG") {
      const tabId = sender?.tab?.id;
      const id = String(msg.id || "").trim();
      if (!tabId || !id) {
        sendResponse({ ok: false, error: "missing tabId or id" });
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
              const dlg = $("#dlg-" + dialogId);
              if (!dlg.length) return { ok: false, reason: "not_found" };
              if (typeof dlg.dialog !== "function")
                return { ok: false, reason: "no_dialog_fn" };
              dlg.dialog("open");
              return { ok: true };
            } catch (e) {
              return { ok: false, error: String(e) };
            }
          }
        },
        (res) => sendResponse(res?.[0]?.result || { ok: false })
      );
      return true;
    }
  } catch (e) {
    console.error("[background] error:", e);
    sendResponse({ ok: false, error: String(e) });
    return true;
  }
});
