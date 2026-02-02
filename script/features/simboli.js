// /script/features/simboli.js

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[simboli] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.simboli = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-simboli-wrap",
    url: "https://www.extremelot.eu/lotnew/simboli.asp",
    title: "Simboli",
    ids: {
      iframe: "ep-simboli-iframe",
      bar: "ep-simboli-bar",
      slider: "ep-simboli-opacity",
      btnMin: "ep-simboli-min",
      btnClose: "ep-simboli-close",
      resizer: "ep-simboli-resize"
    },
    size: { w: 860, h: 560, minW: 380, minH: 160 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 440, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[simboli] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.simboli = { open: overlay.open };
})(window);
