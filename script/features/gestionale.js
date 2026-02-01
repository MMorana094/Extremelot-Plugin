// /script/features/gestionale.js
// SRP: aprire e gestire SOLO il frame/overlay del Gestionale (Dashboard GE)
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[gestionale] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.gestionale = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-gestionale-wrap",
    url: "https://www.extremelot.eu/proc/gestionale/dashboardGE.asp",
    title: "Gestionale",
    ids: {
      iframe: "ep-gestionale-iframe",
      bar: "ep-gestionale-bar",
      slider: "ep-gestionale-opacity",
      btnMin: "ep-gestionale-min",
      btnClose: "ep-gestionale-close",
      resizer: "ep-gestionale-resize"
    },
    size: { w: 980, h: 620, minW: 420, minH: 180 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // come lente/bacheca (se vuoi theme diverso dimmelo)
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 460, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[gestionale] frame pronto (top-mounted, factory)");
    }
  });

  // API uniforme: open() come gli altri (toggle automatico se già aperto)
  w.ExtremePlug.features.gestionale = { open: overlay.open };
})(window);
