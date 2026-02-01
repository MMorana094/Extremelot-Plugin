// script/events/bindings.js (SAFE - NATIVE)
// Nessuna dipendenza da jQuery. Event delegation nativa sul documento target.
// Compatibile con menu.js via ExtremePlug.menu._lastTargetDoc

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function getTargetDocument() {
    const cached = w.ExtremePlug?.menu?._lastTargetDoc;
    if (cached?.body) return cached;

    const resultWin = w.top?.result;
    if (resultWin?.document?.body) return resultWin.document;

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

    function handlerById(id) {
      switch (id) {
        case "apri_editor":
          return () => w.apriEditor?.();

        case "miascheda":
          return () => w.vedischeda?.();

        case "salva_chat":
          return () => {
            debugLog("[BIND] click salva_chat");
            const run = w.ExtremePlug?.features?.salvaChat?.run;
            if (typeof run === "function") return run();
            return w.salvaChat?.(); // fallback legacy
          };

        case "scelto_forum":
          return () => {
            debugLog("[BIND] click bacheca");
            w.ExtremePlug?.features?.bacheca?.open?.();
          };

        case "leggiposta":
          return () => {
            debugLog("[BIND] click leggiposta");
            w.ExtremePlug?.features?.leggiposta?.open?.();
          };

        case "scriviposta":
          return () => w.scriviposta?.();

        case "gest_Chat":
          return () => {
            debugLog("[BIND] click gestionale (gest_Chat)");
            const opened = w.ExtremePlug?.features?.gestionale?.open;
            if (typeof opened === "function") return opened();
            return w.apriGestionale?.();
          };

        case "banca":
          return () => {
            debugLog("[BIND] click banca");
            const open = w.ExtremePlug?.features?.banca?.open;
            if (typeof open === "function") return open();
            return w.apriBanca?.(); // fallback vecchio
          };

        case "lotInforma":
          return () => {
            debugLog("[BIND] click lotInforma");
            const open = w.ExtremePlug?.features?.lotInforma?.open;
            if (typeof open === "function") return open();
            return w.apriLotInforma?.(); // fallback vecchio
          };

        case "mappaTest":
          return () => {
            debugLog("[BIND] click mappa");
            return w.ExtremePlug?.features?.mappa?.open?.();
          };

        case "regole":
          return () => {
            debugLog("[BIND] click regole");
            const open = w.ExtremePlug?.features?.regole?.open;
            if (typeof open === "function") return open();
            // fallback vecchio comportamento, se serve
            if (!C) return;
            const link = C.LOTNEW_BASE + "leggi/leggi.asp";
            openFinestra("regoleLot", "Regolamenti", C.proxyUrl(link));
          };

        case "azioniFinestra":
          return () => {
            debugLog("[BIND] click azioniFinestra");
            w.ExtremePlug?.features?.azioniFinestra?.open?.();
          };

        case "descLuogo":
          return () => {
            debugLog("[BIND] click descLuogo");
            w.ExtremePlug?.features?.lente?.open?.();
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

        try {
          run();
        } catch (err) {
          console.error("[ExtremePlug][bindings] handler error for:", id, err);
        }
      },
      true // capture: più robusto nei frames
    );

    debugLog("[BIND] attached (native)");
  }

  w.setupEventiPlugin = function () {
    const doc = getTargetDocument();
    if (!doc?.body) return;

    // menu.js safe mette doc.__extremeplugBound=false quando cambia doc,
    // qui usiamo un nostro flag separato:
    bindNativeToDocument(doc);
  };
})(window);
