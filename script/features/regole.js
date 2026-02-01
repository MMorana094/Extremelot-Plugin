// /script/features/regole.js
// SRP: aprire e gestire SOLO il frame/overlay delle Regole (regole2.html)
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[regole] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.regole = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-regole-wrap",
    url: "https://www.extremelot.eu/proc/regole/regole2.html",
    title: "Regole",
    ids: {
      iframe: "ep-regole-iframe",
      bar: "ep-regole-bar",
      slider: "ep-regole-opacity",
      btnMin: "ep-regole-min",
      btnClose: "ep-regole-close",
      resizer: "ep-regole-resize"
    },
    size: { w: 980, h: 650, minW: 420, minH: 220 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // stesso theme di lente/bacheca
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 460, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[regole] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.regole = { open: overlay.open };
})(window);
