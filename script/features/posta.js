// features/posta.js
// Coerente con ExtremePlug (NO background, NO overlay, NO CSP issues)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const POSTA_URL = "https://www.extremelot.eu/proc/posta/leggilaposta.asp";
  const WIN_ID = "postaLot";
  const WIN_TITLE = "Posta";

  function open() {
    const opts = "width=900,height=550,scrollbars=yes,resizable=yes";

    const hasTopFinestra = typeof w.top?.finestra === "function";

    debugLog("[POSTA] open", {
      url: POSTA_URL,
      opts,
      hasTopFinestra
    });

    if (hasTopFinestra) {
      try {
        debugLog("[POSTA] using top.finestra");
        w.top.finestra(WIN_ID, WIN_TITLE, POSTA_URL, opts);

        // 🔥 focus forzato
        try { w.top.focus(); } catch (_) {}

        return;
      } catch (e) {
        debugLog("[POSTA] top.finestra failed", e);
      }
    }

    // fallback finale
    try {
      w.open(POSTA_URL, "_blank", opts);
    } catch (_) {}
  }

  w.ExtremePlug.features.leggiposta = {
    open,
    url: POSTA_URL,
    id: WIN_ID,
    title: WIN_TITLE
  };

  if (typeof w.leggiposta !== "function") {
    w.leggiposta = open;
  }

  debugLog("[POSTA] feature loaded");
})(window);
