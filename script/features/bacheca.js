// /script/features/bacheca.js
// SRP: aprire e gestire SOLO il frame/overlay della Bacheca
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[bacheca] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.bacheca = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-bacheca-wrap",
    url: "https://www.extremelot.eu/proc/forum/bacheca.asp",
    title: "Bacheca",
    ids: {
      iframe: "ep-bacheca-iframe",
      bar: "ep-bacheca-bar",
      slider: "ep-bacheca-opacity",
      btnMin: "ep-bacheca-min",
      btnClose: "ep-bacheca-close",
      resizer: "ep-bacheca-resize"
    },
    size: { w: 820, h: 520, minW: 380, minH: 160 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 420, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[bacheca] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.bacheca = { open: overlay.open };
})(window);
