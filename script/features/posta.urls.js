// script/features/posta.urls.js
// Posta URL helpers: costruzione URL "scrivi" usando pgData.js (ExtremePlug.pg.getName)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.postaUrls = w.ExtremePlug.features.postaUrls || {};
  const urls = w.ExtremePlug.features.postaUrls;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // Config canonica (se un domani cambia, aggiorni qui)
  const START_URL = "https://www.extremelot.eu/proc/posta/leggilaposta.asp";
  const SCRIVI_BASE = "https://www.extremelot.eu/proc/posta/scrivialtri.asp";

  function getPgName() {
    try {
      const fn = w.ExtremePlug?.pg?.getName || w.top?.ExtremePlug?.pg?.getName;
      if (typeof fn === "function") {
        const v = fn();
        return (v && String(v).trim()) ? String(v).trim() : null;
      }
    } catch (_) {}
    return null;
  }

  function waitPgName(maxAttempts, delayMs) {
    return new Promise((resolve) => {
      const tick = (n) => {
        const name = getPgName();
        debugLog("[POSTA][urls] PG name check", { attempt: maxAttempts - n, name });

        if (name) return resolve(name);
        if (n <= 0) return resolve(null);

        setTimeout(() => tick(n - 1), delayMs);
      };
      tick(maxAttempts);
    });
  }

  async function buildScriviUrlWithNomepg() {
    const pg = await waitPgName(12, 120);
    if (!pg) return SCRIVI_BASE;
    return SCRIVI_BASE + "?nomepg=" + encodeURIComponent(pg);
  }

  // Public API
  urls.START_URL = START_URL;
  urls.SCRIVI_BASE = SCRIVI_BASE;
  urls.getPgName = getPgName;
  urls.waitPgName = waitPgName;
  urls.buildScriviUrlWithNomepg = buildScriviUrlWithNomepg;

  // Export su top (coerenza)
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.postaUrls = urls;
    }
  } catch (_) {}

  debugLog("[POSTA][urls] loaded");
})(window);
