// /script/features/lotInforma.js
// SRP: aprire e gestire SOLO il frame/overlay di LOT Informa (forum codforum=14)
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[lotInforma] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    w.ExtremePlug.features.lotInforma = { open: function () {} };
    return;
  }

  const overlay = factory({
    id: "ep-lotInforma-wrap",
    url: "https://www.extremelot.eu/proc/forum/forum.asp?codforum=14",
    title: "LOT Informa",
    ids: {
      iframe: "ep-lotInforma-iframe",
      bar: "ep-lotInforma-bar",
      slider: "ep-lotInforma-opacity",
      btnMin: "ep-lotInforma-min",
      btnClose: "ep-lotInforma-close",
      resizer: "ep-lotInforma-resize"
    },
    size: { w: 980, h: 650, minW: 420, minH: 220 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF"
    },
    minimize: { w: 460, h: 34, right: 12, bottom: 12 },
    onAfterMount: function () {
      debugLog("[lotInforma] frame pronto (top-mounted, factory)");
    }
  });

  w.ExtremePlug.features.lotInforma = { open: overlay.open };
})(window);
