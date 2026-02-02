// /script/features/collegati.js
// SRP: aprire e gestire SOLO il frame/overlay della pagina "Collegati"
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[collegati] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.collegati = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-collegati-wrap",
    url: "https://www.extremelot.eu/proc/collegati.asp",
    title: "Collegati",
    ids: {
      iframe: "ep-collegati-iframe",
      bar: "ep-collegati-bar",
      slider: "ep-collegati-opacity",
      btnMin: "ep-collegati-min",
      btnClose: "ep-collegati-close",
      resizer: "ep-collegati-resize"
    },
    size: { w: 820, h: 520, minW: 380, minH: 160 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // uguale a lente/bacheca (se vuoi stile "azioni" dimmelo e lo allineo)
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 420, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[collegati] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.collegati = { open: overlay.open };
})(window);
