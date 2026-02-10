// /script/features/lente.js
// Overlay/iframe: mount SEMPRE su top.document.documentElement (frameset-safe)
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[lente] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.lente = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-descLuogo-wrap",
    url: "https://www.extremelot.eu/proc/vedi_desc_21.asp",
    title: "Descrizione del luogo",
    ids: {
      iframe: "ep-descLuogo-iframe",
      bar: "ep-descLuogo-bar",
      slider: "ep-descLuogo-opacity",
      btnMin: "ep-descLuogo-min",
      btnClose: "ep-descLuogo-close",
      resizer: "ep-descLuogo-resize"
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
      debugLog("[lente] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.lente = { open: overlay.open };
})(window);