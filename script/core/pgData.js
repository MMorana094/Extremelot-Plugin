// script/core/pgData.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  const debugLog =
    w.ExtremePlug?.debug?.debugLog ||
    function () {};

  // =========================
  // PG: fonte canonica = frame "logo"
  // =========================
  function getPgName() {
    try {
      const fw = w.top?.frames?.logo;
      if (!fw?.document) return null;

      const el = fw.document.querySelector("input[name='player']");
      const v = el?.value;
      return (v && String(v).trim()) ? String(v).trim() : null;
    } catch (e) {
      debugLog("getPgName error:", e);
      return null;
    }
  }

  function getPgData() {
    try {
      const fw = w.top?.frames?.logo;
      const doc = fw?.document;
      if (!doc) return { nome: null, luogo: null, html: null };

      const body = doc.body;
      const html = body ? (body.innerHTML || null) : null;

      // luogo: nel tuo logo frame esiste input[name='titolo'] (come nel vecchio pgData)
      const nome = getPgName();
      const titoloEl = doc.querySelector("input[name='titolo']");
      let luogo = titoloEl?.value || null;
      if (luogo) luogo = String(luogo).replace(/<\/?b>/g, "");

      debugLog("PG data:", { nome, luogo });
      return { nome, luogo, html };
    } catch (e) {
      debugLog("getPgData error:", e);
      return { nome: null, luogo: null, html: null };
    }
  }

  // Namespace nuovo
  w.ExtremePlug.pg = w.ExtremePlug.pg || {};
  w.ExtremePlug.pg.getName = getPgName;
  w.ExtremePlug.pg.getData = getPgData;

  // Compatibilità nomi legacy
  w.RecuperoDatiPG = getPgData;
  w.importaDatiPG = getPgName;

  // =========================
  // UI Host: overlay canonico = frame "testo"
  // =========================
  function getOverlayDoc() {
    try {
      const d = w.top?.frames?.testo?.document;
      if (d?.documentElement) return d;
    } catch (_) {}
    return null;
  }

  function appendToOverlayWhenReady(fn) {
    const t = setInterval(() => {
      try {
        const doc = getOverlayDoc();
        if (doc?.body) {
          clearInterval(t);
          fn(doc);
        }
      } catch (_) {}
    }, 100);
  }

  w.ExtremePlug.ui = w.ExtremePlug.ui || {};
  w.ExtremePlug.ui.getOverlayDoc = getOverlayDoc;
  w.ExtremePlug.ui.appendToOverlayWhenReady = appendToOverlayWhenReady;

})(window);
