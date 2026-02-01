// script/main.js
(function (w) {
  // Inizializza debug mode (se presente) appena possibile
  try { w.ExtremePlug?.debug?.initDebugMode?.(); } catch (_) {}
  try { w.ExtremePlug?.debug?.bootCheck?.("main loaded"); } catch (_) {}

  w.jQuery(() => {
    if (w.top !== w) return;
    try { w.ExtremePlug?.debug?.bootCheck?.("dom ready"); } catch (_) {}
    w.ExtremePlug?.menu?.ensureMenuInResult?.();
  });
})(window);
