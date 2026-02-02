// script/events/bindings.js

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // DOC dove sta il menu (frame scelte)
  function getMenuDocument() {
    const sw = w.top?.scelte;
    if (sw?.document?.body) return sw.document;

    // fallback (se per qualche motivo scelte non esiste)
    const cached = w.ExtremePlug?.menu?._lastTargetDoc;
    if (cached?.body) return cached;

    const resultWin = w.top?.result;
    if (resultWin?.document?.body) return resultWin.document;

    return null;
  }

  // DOC dove devono agire le feature (frame result -> testo)
  function getActionTargetDocument() {
    const resultWin = w.top?.result;
    const doc = resultWin?.document;
    if (!doc) return null;

    // Se result NON è un frameset, usa direttamente result.document
    let hasFrames = false;
    try {
      hasFrames = !!doc.querySelector("frameset") || !!doc.querySelector("frame");
    } catch (_) {}

    if (!hasFrames) {
      if (doc.body) return doc;
      return null;
    }

    // Se result è frameset, preferisci il frame "testo"
    const inner = resultWin.frames?.["testo"];
    if (inner?.document?.body) return inner.document;

    // fallback: primo frame disponibile
    if (resultWin.frames?.length && resultWin.frames[0]?.document?.body) {
      return resultWin.frames[0].document;
    }

    return null;
  }

  function bindNativeToDocument(doc) {
    if (!doc || !doc.body) return;

    // evita rebind continuo sullo stesso doc
    if (doc.__extremeplugNativeBound) return;
    doc.__extremeplugNativeBound = true;

    const C = w.ExtremePlug?.constants;

    function openFinestra(id, title, url, opts) {
      w.finestra?.(id, title, url, opts || "width=950,height=550");
    }

    // Helper: chiama feature in modo sicuro
    function callFeature(pathArr, fallbackFn) {
      let cur = w.ExtremePlug;
      for (const k of pathArr) cur = cur?.[k];
      if (typeof cur === "function") return cur();
      if (typeof fallbackFn === "function") return fallbackFn();
    }

    function handlerById(id) {
      switch (id) {
        case "apri_editor":
          return () => w.apriEditor?.();

        case "miascheda":
          return () => w.vedischeda?.();

        case "salva_chat":
          return () => {
            debugLog("[BIND] click salva_chat");
            return callFeature(["features", "salvaChat", "run"], () => w.salvaChat?.());
          };

        case "scelto_forum":
          return () => {
            debugLog("[BIND] click bacheca");
            return callFeature(["features", "bacheca", "open"]);
          };

        case "leggiposta":
          return () => {
            debugLog("[BIND] click leggi posta");
            return callFeature(["features", "posta", "open"]);
          };

        case "scriviposta":
          return () => {
            debugLog("[BIND] click scrivi posta");
            return callFeature(["features", "posta", "scrivi"]);
          };

        case "gest_Chat":
          return () => {
            debugLog("[BIND] click gestionale (gest_Chat)");
            return callFeature(["features", "gestionale", "open"], () => w.apriGestionale?.());
          };

        case "banca":
          return () => {
            debugLog("[BIND] click banca");
            return callFeature(["features", "banca", "open"], () => w.apriBanca?.());
          };

        case "lotInforma":
          return () => {
            debugLog("[BIND] click lotInforma");
            return callFeature(["features", "lotInforma", "open"], () => w.apriLotInforma?.());
          };

        case "mappaTest":
          return () => {
            debugLog("[BIND] click mappa");
            return callFeature(["features", "mappa", "open"]);
          };

        case "regole":
          return () => {
            debugLog("[BIND] click regole");
            const did = callFeature(["features", "regole", "open"]);
            if (did !== undefined) return;

            if (!C) return;
            const link = C.LOTNEW_BASE + "leggi/leggi.asp";
            openFinestra("regoleLot", "Regolamenti", C.proxyUrl(link));
          };

        case "azioniFinestra":
          return () => {
            debugLog("[BIND] click azioniFinestra");
            return callFeature(["features", "azioniFinestra", "open"]);
          };

        case "descLuogo":
          return () => {
            debugLog("[BIND] click descLuogo");
            return callFeature(["features", "lente", "open"]);
          };

        // --- OVERLAY ---
        case "aprisimboli":
          return () => {
            debugLog("[BIND] click aprisimboli");
            return callFeature(["features", "simboli", "open"]);
          };

        case "dovegioco":
          return () => {
            debugLog("[BIND] click dovegioco");
            return callFeature(["features", "chiedove", "open"]);
          };

        case "apri_online":
          return () => {
            debugLog("[BIND] click apri_online");
            return callFeature(["features", "collegati", "open"]);
          };

        default:
          return null;
      }
    }

    // Delegation: cattura click su qualunque elemento dentro #menu-container
    doc.addEventListener(
      "click",
      function (e) {
        const t = e.target;
        if (!t || !t.closest) return;

        const cmd = t.closest("#menu-container .comando");
        if (!cmd) return;

        const id = cmd.id;
        if (!id) return;

        const run = handlerById(id);
        if (!run) return;

        e.preventDefault?.();
        e.stopPropagation?.();
        e.stopImmediatePropagation?.();

        try {
          run();
        } catch (err) {
          debugLog("[BIND] handler error for:", id, err);
        }
      },
      true
    );

    debugLog("[BIND] attached (native) on menu doc");
  }

  w.setupEventiPlugin = function () {
    // 1) bind sul documento dove vive il menu (scelte)
    const menuDoc = getMenuDocument();
    if (!menuDoc?.body) return;

    // 2) aggiorna SEMPRE il target delle azioni al result/testo
    const targetDoc = getActionTargetDocument();
    if (targetDoc?.body) {
      w.ExtremePlug.menu = w.ExtremePlug.menu || {};
      w.ExtremePlug.menu._lastTargetDoc = targetDoc;

      // se altrove usi questo flag, lo resettiamo (coerente col tuo menu.js)
      targetDoc.__extremeplugBound = false;

      debugLog("[BIND] action target set to result/testo doc");
    } else {
      debugLog("[BIND] action target NOT found (result/testo)");
    }

    // 3) attacca listener ai click del menu
    bindNativeToDocument(menuDoc);
  };
})(window);
