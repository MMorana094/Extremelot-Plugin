// script/features/overlayFeatures.js
// Features Registry: consolida in un unico file tutte le feature che aprono
// SOLO un overlay iframe "semplice" (drag/resize/minimize/opacity) tramite
// la Overlay Factory (/script/ui/overlay.js).
//
// Sostituisce (comportamento invariato):
//   bacheca.js, azioniFinestra.js, gestionale.js, banca.js, chiedove.js,
//   mappa.js, lotInforma.js, regole.js, simboli.js, collegati.js, lente.js
//
// Dipende da: /script/ui/overlay.js (Overlay Factory)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // Tema condiviso dalla maggioranza delle feature (invariato rispetto agli
  // originali). Solo "azioniFinestra" ha un tema diverso: viene sovrascritto
  // esplicitamente nella sua config qui sotto.
  const DEFAULT_THEME = {
    wrapBorder: "1px solid rgba(0,0,0,0.35)",
    barBg: "#6e0000",
    barBorderBottom: "1px solid rgba(0,0,0,0.12)",
    barTextColor: "#FFFFFF",
    titleColor: "#FFFFFF"
  };

  const DEFAULT_SNAP = { edgePad: 10, snapPx: 18 };

  // ===========================================================
  // Config per ciascuna feature
  // ===========================================================
  const FEATURE_CONFIGS = [
    {
      key: "bacheca",
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
      minimize: { w: 420, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "azioniFinestra",
      id: "ep-azioni-wrap",
      url: "https://www.extremelot.eu/proc/azioni_26.asp",
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
      // ✅ tema diverso rispetto al default: preservato tale e quale
      theme: {
        wrapBorder: "2px solid #6e0000",
        barBg: "#6e0000",
        barBorderBottom: "1px solid #6e0000",
        barTextColor: "#FFFFFF",
        titleColor: "#FFFFFF"
      },
      minimize: { w: 420, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "gestionale",
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
      minimize: { w: 460, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "banca",
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
      minimize: { w: 460, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "chiedove",
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
      minimize: { w: 440, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "mappa",
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
      minimize: { w: 520, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "lotInforma",
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
      minimize: { w: 460, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "regole",
      id: "ep-regole-wrap",
      url: "https://www.extremelot.eu/link/regolenew/index.html",
      title: "Regole",
      backButton: false,
      ids: {
        iframe: "ep-regole-iframe",
        bar: "ep-regole-bar",
        slider: "ep-regole-opacity",
        btnMin: "ep-regole-min",
        btnClose: "ep-regole-close",
        resizer: "ep-regole-resize"
      },
      size: { w: 980, h: 650, minW: 420, minH: 220 },
      minimize: { w: 460, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "simboli",
      id: "ep-simboli-wrap",
      url: "https://www.extremelot.eu/lotnew/simbolinew.asp",
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
      minimize: { w: 440, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "collegati",
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
      minimize: { w: 420, h: 34, right: 12, bottom: 12 }
    },
    {
      key: "lente",
      id: "ep-descLuogo-wrap",
      url: "https://www.extremelot.eu/proc/vedi_desc_21.asp",
      title: "Descrizione del luogo",
      backButton: false,
      ids: {
        iframe: "ep-descLuogo-iframe",
        bar: "ep-descLuogo-bar",
        slider: "ep-descLuogo-opacity",
        btnMin: "ep-descLuogo-min",
        btnClose: "ep-descLuogo-close",
        resizer: "ep-descLuogo-resize"
      },
      size: { w: 820, h: 520, minW: 380, minH: 160 },
      minimize: { w: 420, h: 34, right: 12, bottom: 12 }
    }
  ];

  // ===========================================================
  // Registrazione
  // ===========================================================
  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;

  if (typeof factory !== "function") {
    debugLog("[overlayFeatures] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    FEATURE_CONFIGS.forEach(function (f) {
      w.ExtremePlug.features[f.key] = { open: function () {} };
    });
    return;
  }

  FEATURE_CONFIGS.forEach(function (f) {
    const overlay = factory({
      id: f.id,
      url: f.url,
      title: f.title,
      backButton: f.backButton, // undefined => default true (gestito da createOverlay)
      ids: f.ids,
      size: f.size,
      snap: DEFAULT_SNAP,
      theme: f.theme || DEFAULT_THEME,
      minimize: f.minimize,
      onAfterMount: function () {
        debugLog("[" + f.key + "] frame pronto (top-mounted, factory)");
      }
    });

    w.ExtremePlug.features[f.key] = { open: overlay.open };
  });

  debugLog("[overlayFeatures] " + FEATURE_CONFIGS.length + " feature registrate");
})(window);
