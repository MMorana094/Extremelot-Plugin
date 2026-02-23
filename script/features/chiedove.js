// /script/features/chiedove.js
// SRP: aprire e gestire SOLO il frame/overlay della pagina "Chiedo Dove"
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[chiedove] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.chiedove = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-chiedove-wrap",
    url: "https://www.extremelot.eu/proc/chiedove.asp",
    title: "Chi e dove",
    backButton: false,
    ids: {
      iframe: "ep-chiedove-iframe",
      bar: "ep-chiedove-bar",
      slider: "ep-chiedove-opacity",
      btnMin: "ep-chiedove-min",
      btnClose: "ep-chiedove-close",
      resizer: "ep-chiedove-resize"
    },
    size: { w: 860, h: 560, minW: 380, minH: 160 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // coerente con collegati/lente/bacheca
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 440, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[chiedove] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.chiedove = { open: overlay.open };
})(window);
