// /script/features/leggiPosta.js
// SRP: aprire/chiudere la "Posta" usando finestra() nel frame corretto
// PATCH: usa SEMPRE proxy altri.php (legacy ok)
// PATCH: host = window che contiene sia finestra() che #limitedialog (quasi sempre top.result)
// PATCH: call(hostWin, ...) per fissare "this"

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const REAL = "https://www.extremelot.eu/proc/posta/leggilaposta.asp";
  const PROXY =
    "https://extremeplug.altervista.org/docs/plugin/altri.php?link=" +
    encodeURIComponent(REAL);

  const WIN_ID = "postaLot";
  const WIN_TITLE = "Posta";
  const WIN_OPTS = "width=900,height=550";

  let _opened = false;
  let _hostWin = null;
  let _hostDoc = null;

  function getTopWin() {
    try {
      return w.top || w;
    } catch (_) {
      return w;
    }
  }

  function hasDialogContainer(doc) {
    try {
      if (!doc) return false;
      // in LOT spesso è un id
      if (doc.getElementById("limitedialog")) return true;
      // fallback se fosse una classe/altro (ma di solito è id)
      if (doc.querySelector && doc.querySelector("#limitedialog")) return true;
    } catch (_) {}
    return false;
  }

  function pickHostWindow() {
    const topWin = getTopWin();

    const candidates = [];
    try { if (topWin?.result) candidates.push({ win: topWin.result, where: "top.result" }); } catch (_) {}
    try { if (topWin) candidates.push({ win: topWin, where: "top" }); } catch (_) {}
    try { candidates.push({ win: w, where: "window" }); } catch (_) {}

    // 1) preferisci chi ha finestra() + #limitedialog
    for (const c of candidates) {
      try {
        const hw = c.win;
        const hd = hw?.document || null;
        if (hw && typeof hw.finestra === "function" && hasDialogContainer(hd)) {
          return { hostWin: hw, hostDoc: hd, where: c.where, hasLimitedialog: true };
        }
      } catch (_) {}
    }

    // 2) fallback: chiunque abbia finestra()
    for (const c of candidates) {
      try {
        const hw = c.win;
        const hd = hw?.document || null;
        if (hw && typeof hw.finestra === "function") {
          return { hostWin: hw, hostDoc: hd, where: c.where, hasLimitedialog: hasDialogContainer(hd) };
        }
      } catch (_) {}
    }

    return { hostWin: null, hostDoc: null, where: "none", hasLimitedialog: false };
  }

  function tryCloseDialog() {
    const doc = _hostDoc || w.document;
    if (!doc) return false;
    try {
      const el = doc.getElementById("dlg-" + WIN_ID);
      if (el) {
        el.remove();
        return true;
      }
    } catch (_) {}
    return false;
  }

  function leggiposta() {
    if (_opened) {
      const closed = tryCloseDialog();
      _opened = false;
      debugLog("[leggiPosta] chiuso (toggle)", { closed });
      return;
    }

    const pick = pickHostWindow();
    _hostWin = pick.hostWin;
    _hostDoc = pick.hostDoc;

    debugLog("[leggiPosta] host scelto", {
      where: pick.where,
      hasHost: !!_hostWin,
      hasLimitedialog: !!pick.hasLimitedialog
    });

    try {
      if (_hostWin && typeof _hostWin.finestra === "function") {
        // IMPORTANT: call(hostWin, ...) per far usare il suo contesto interno
        _hostWin.finestra.call(_hostWin, WIN_ID, WIN_TITLE, PROXY, WIN_OPTS);
        _opened = true;
        debugLog("[leggiPosta] aperto via finestra()", { proxy: true });
        return;
      }

      // fallback: tab nuova
      w.open(PROXY, "_blank", "noopener,noreferrer");
      _opened = true;
      debugLog("[leggiPosta] aperto via window.open (fallback)");
    } catch (err) {
      console.error("[ExtremePlug][leggiPosta] errore:", err);
      _opened = false;
    }
  }

  w.ExtremePlug.features.leggiposta = { leggiposta };

  // Se vuoi compatibilità con vecchie chiamate (w.leggiposta()):
  // w.leggiposta = leggiposta;
})(window);
