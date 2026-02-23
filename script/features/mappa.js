// /script/features/mappa.js
// SRP: aprire e gestire SOLO il frame/overlay della Mappa esterna
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[mappa] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.mappa = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-mappa-wrap",
    url: "https://ordinedelleguide.altervista.org/mappa/index.php",
    title: "Mappa",
    backButton: false,
    ids: {
      iframe: "ep-mappa-iframe",
      bar: "ep-mappa-bar",
      slider: "ep-mappa-opacity",
      btnMin: "ep-mappa-min",
      btnClose: "ep-mappa-close",
      resizer: "ep-mappa-resize"
    },
    size: { w: 1100, h: 700, minW: 520, minH: 260 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // come lente/bacheca, se vuoi un colore diverso dimmelo
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 520, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[mappa] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.mappa = { open: overlay.open };
})(window);
