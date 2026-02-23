// /script/features/azioniFinestra.js
// SRP: aprire e gestire SOLO il frame/overlay delle "Azioni nel Luogo"
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[azioniFinestra] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.azioniFinestra = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-azioni-wrap",
    url: "https://www.extremelot.eu/proc/azioni_21.asp",
    title: "Azioni nel Luogo",
    backButton: false,
    ids: {
      iframe: "ep-azioni-iframe",
      bar: "ep-azioni-bar",
      slider: "ep-azioni-opacity",
      btnMin: "ep-azioni-min",
      btnClose: "ep-azioni-close",
      resizer: "ep-azioni-resize"
    },
    size: { w: 820, h: 520, minW: 380, minH: 160 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      // azioni: border theme + titlebar theme
      wrapBorder: "2px solid #6e0000",
      barBg: "#6e0000",
      barBorderBottom: "1px solid #6e0000",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 420, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[azioniFinestra] frame pronto (top-mounted, factory)");
    }
  });

  // Compat: manteniamo la stessa API di prima (open = toggle)
  w.ExtremePlug.features.azioniFinestra = { open: overlay.open };
})(window);
