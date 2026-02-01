// /script/features/banca.js
// SRP: aprire e gestire SOLO il frame/overlay della Banca
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[banca] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.banca = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-banca-wrap",
    url: "https://www.extremelot.eu/lotnew/banca_d.asp",
    title: "Banca",
    ids: {
      iframe: "ep-banca-iframe",
      bar: "ep-banca-bar",
      slider: "ep-banca-opacity",
      btnMin: "ep-banca-min",
      btnClose: "ep-banca-close",
      resizer: "ep-banca-resize"
    },
    size: { w: 900, h: 600, minW: 420, minH: 200 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // come lente/bacheca
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 460, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[banca] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.banca = { open: overlay.open };
})(window);
