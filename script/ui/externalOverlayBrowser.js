// script/ui/externalOverlayBrowser.js
// Apre URL esterni dentro un overlay iframe (con back arrow ON).
// Ogni click crea un overlay nuovo (id univoco).
// Richiede: /script/ui/overlay.js caricato prima.

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.externalOverlayBrowser = w.ExtremePlug.features.externalOverlayBrowser || {};

  const api = w.ExtremePlug.features.externalOverlayBrowser;
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[externalOverlayBrowser] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    api.open = function () {};
    return;
  }

  function clamp(n, a, b) {
    n = Number(n);
    if (!isFinite(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function normalizeUrl(u) {
    const s = String(u || "").trim();
    if (!s) return "";
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return "https://" + s;
    return s;
  }

  function pickTitle(url) {
    try {
      const u = new URL(url);
      return u.host || "Browser";
    } catch (_) {
      return "Browser";
    }
  }

  function uid() {
    try {
      return crypto?.randomUUID?.() || ("ep_browser_" + Date.now() + "_" + Math.random().toString(16).slice(2));
    } catch (_) {
      return "ep_browser_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
  }

  /**
   * api.open(url, opts?)
   * opts:
   *  - title?: string
   *  - size?: { w,h,minW,minH }
   */
  api.open = function open(url, opts) {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) return;

    const id = uid();
    const title = String(opts?.title || pickTitle(finalUrl));

    const size = opts?.size || {};
    const W = clamp(size.w ?? 980, 520, 1600);
    const H = clamp(size.h ?? 680, 300, 1200);

    const overlay = factory({
      id: id,
      url: finalUrl,
      title: title,

      // ✅ QUI serve la back arrow
      backButton: true,

      ids: {
        iframe: id + "-iframe",
        bar: id + "-bar",
        slider: id + "-opacity",
        btnMin: id + "-min",
        btnClose: id + "-close",
        resizer: id + "-resize",
      },

      size: { w: W, h: H, minW: clamp(size.minW ?? 520, 360, 1200), minH: clamp(size.minH ?? 260, 200, 900) },
      snap: { edgePad: 10, snapPx: 18 },

      theme: {
        wrapBorder: "1px solid rgba(0,0,0,0.35)",
        barBg: "#6e0000",
        barBorderBottom: "1px solid rgba(0,0,0,0.12)",
        barTextColor: "#FFFFFF",
        titleColor: "#FFFFFF",
      },

      minimize: { w: 560, h: 34, right: 12, bottom: 12 },

      onAfterMount: function ({ iframe }) {
        try {
          // Hardening minimo
          iframe.setAttribute("referrerpolicy", "no-referrer");
          // sandbox? (NON lo metto perché romperebbe molti siti: login, JS, redirect, etc.)
          // iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-popups allow-same-origin");
        } catch (_) {}
      },
    });

    // Crea subito l’overlay
    try {
      overlay.open();
    } catch (e) {
      debugLog("[externalOverlayBrowser] open err", e);
    }
  };

  // Export su top
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.externalOverlayBrowser = api;
    }
  } catch (_) {}

  debugLog("[externalOverlayBrowser] loaded");
})(window);