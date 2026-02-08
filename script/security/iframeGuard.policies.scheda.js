// script/security/iframeGuard.policies.scheda.js
// Policy Scheda per iframeGuard

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.security = w.ExtremePlug.security || {};
  w.ExtremePlug.security.iframeGuardPolicies = w.ExtremePlug.security.iframeGuardPolicies || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};
  debugLog("[iframeGuardPolicies.scheda] loaded");

  // regole specifiche Scheda:
  const blockPosta = /\/proc\/posta\//i;

  function makeOnclickResolver(opts) {
    const SCHEDA_BASE_URL = String(opts?.schedaBaseUrl || "");
    return function onclickResolver(js, baseUrl) {
      try {
        const s = String(js || "");

        // location / window.open
        let m = s.match(/(?:top|parent)?\.?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return new URL(m[1], baseUrl).href;

        m = s.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return new URL(m[1], baseUrl).href;

        m = s.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return new URL(m[1], baseUrl).href;

        // dettagli('Nome') / posta('Nome')
        m = s.match(/(dettagli|posta)\s*\(\s*'([^']+)'\s*\)/i);
        if (m) {
          const fn = String(m[1] || "").toLowerCase();
          const name = String(m[2] || "").trim();
          if (fn === "posta") return "BLOCK";
          if (fn === "dettagli") return SCHEDA_BASE_URL + encodeURIComponent(name);
        }
      } catch (_) {}
      return null;
    };
  }

  /**
   * buildSchedaGuardConfig({ baseUrl, schedaBaseUrl, debugPrefix })
   */
  function buildSchedaGuardConfig(params) {
    const baseUrl = String(params?.baseUrl || "");
    const debugPrefix = String(params?.debugPrefix || "[scheda]");
    const onclickResolver = makeOnclickResolver({ schedaBaseUrl: params?.schedaBaseUrl });

    return {
      baseUrl,
      blockList: [blockPosta],
      helpers: { onclickResolver },
      handlers: {
        onBlocked: (abs, ctx) => debugLog(debugPrefix + "[guard] blocked", { abs, ctx }),
        onBeforeNavigate: (abs, ctx) => debugLog(debugPrefix + "[guard] navigate->iframe", { abs, ctx }),
      },
    };
  }

  /**
   * attachSchedaPolicy(iframeEl, { schedaBaseUrl, debugPrefix })
   * Dipende da script/security/iframeGuard.js (installRecursiveGuard)
   */
  function attachSchedaPolicy(iframeEl, params) {
    const guard = w.ExtremePlug?.security?.iframeGuard?.installRecursiveGuard;
    if (typeof guard !== "function") {
      debugLog("[iframeGuardPolicies.scheda] abort: iframeGuard missing (load script/security/iframeGuard.js before policies)");
      return;
    }
    const baseUrl = String(iframeEl?.src || "");
    const cfg = buildSchedaGuardConfig({
      baseUrl,
      schedaBaseUrl: params?.schedaBaseUrl,
      debugPrefix: params?.debugPrefix || "[scheda]",
    });
    guard(iframeEl, cfg);
  }

  w.ExtremePlug.security.iframeGuardPolicies.scheda = {
    buildSchedaGuardConfig,
    attachSchedaPolicy,
  };
})(window);
