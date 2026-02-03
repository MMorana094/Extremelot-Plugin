// script/ui/getUiDoc.js
// UI Host selection (frame-safe + visibility aware)
// Centralizza la logica per scegliere il document dove montare overlay/dialog.

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.ui = w.ExtremePlug.ui || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function isFramesetDoc(doc) {
    try {
      const b = doc?.body;
      if (!b) return true;
      const tag = (b.tagName || "").toUpperCase();
      if (tag === "FRAMESET") return true;
      if (doc.querySelector("frameset")) return true;
      return false;
    } catch (_) {
      return true;
    }
  }

  function getVisibleArea(win) {
    try {
      const fe = win.frameElement;
      if (!fe) {
        const vw = Math.max(0, win.innerWidth || 0);
        const vh = Math.max(0, win.innerHeight || 0);
        return vw * vh;
      }
      const cs = win.getComputedStyle(fe);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      const r = fe.getBoundingClientRect();
      return Math.max(0, r.width) * Math.max(0, r.height);
    } catch (_) {
      return 0;
    }
  }

  function getUiDoc() {
    // 0) doc target del menu (se disponibile)
    try {
      const cached = w.ExtremePlug?.menu?._lastTargetDoc;
      if (cached?.body && !isFramesetDoc(cached)) return cached;
    } catch (_) {}

    // 1) preferisci top.result
    try {
      const d = w.top?.result?.document;
      if (d?.body && !isFramesetDoc(d)) return d;
    } catch (_) {}

    // 2) scegli frame visibile più grande
    try {
      const best = { doc: null, score: 0 };
      const visit = (win) => {
        let doc = null;
        try { doc = win.document; } catch (_) { doc = null; }
        if (doc?.body && !isFramesetDoc(doc)) {
          const area = getVisibleArea(win);
          const url = doc.URL || "";
          const boost =
            (url.includes("/proc/") ? 1.25 : 1.0) *
            (url.includes("/lotnew/") ? 1.10 : 1.0);
          const score = area * boost;
          if (score > best.score) { best.doc = doc; best.score = score; }
        }
        try { for (let i = 0; i < win.frames.length; i++) visit(win.frames[i]); } catch (_) {}
      };
      visit(w.top);
      if (best.doc?.body) return best.doc;
    } catch (_) {}

    // 3) fallback
    try {
      if (w.document?.body && !isFramesetDoc(w.document)) return w.document;
    } catch (_) {}

    return null;
  }

  function get$ForDoc(doc) {
    try {
      return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  // Export
  w.ExtremePlug.ui.getUiDoc = getUiDoc;
  w.ExtremePlug.ui.get$ForDoc = get$ForDoc;
  w.ExtremePlug.ui._isFramesetDoc = isFramesetDoc; // utile per debug, opzionale

  debugLog("[ui.getUiDoc] loaded");
})(window);
