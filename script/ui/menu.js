// script/ui/menu.js  (SAFE MODE)
// Niente MutationObserver. Niente try/catch silenziosi. Throttle forte.
// Compatibile con bindings.js via ExtremePlug.menu._lastTargetDoc

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.menu = w.ExtremePlug.menu || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function isFramesetHostDocument(doc) {
    try {
      return !!doc.querySelector("frameset") || !!doc.querySelector("frame[name='result']");
    } catch (e) {
      console.error("[ExtremePlug][menu] isFramesetHostDocument error:", e);
      return false;
    }
  }

  function getResultTargetWindow(resultWin) {
    // Se result è frameset interno, preferisci "testo", altrimenti result stesso
    const doc = resultWin?.document;
    if (!doc) return null;

    const hasFrames = !!doc.querySelector("frameset") || !!doc.querySelector("frame");
    if (!hasFrames) return resultWin;

    const inner = resultWin.frames?.["testo"];
    if (inner?.document) return inner;

    if (resultWin.frames?.length) return resultWin.frames[0];

    return resultWin;
  }

  function ensureFontAwesome(doc) {
    if (!doc?.head) return;
    if (doc.getElementById("extremeplug-fa")) return;

    const link = doc.createElement("link");
    link.id = "extremeplug-fa";
    link.rel = "stylesheet";
    link.href = "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
    doc.head.appendChild(link);
  }

  function ensureMenuStyle(doc) {
    if (!doc?.head) return;
    if (doc.getElementById("extremeplug-menu-style")) return;

    const style = doc.createElement("style");
    style.id = "extremeplug-menu-style";
    style.textContent = `
      #menu-container, #menu-container * { pointer-events:auto; }

      #altroframeperaltraroba{
        display:flex; flex-wrap:wrap; gap:6px;
        background:rgba(255,255,255,.92);
        border:1px solid #ccc;
        padding:6px; border-radius:6px;
      }

      #altroframeperaltraroba .comando{
        width:30px; height:30px; line-height:30px;
        text-align:center; cursor:pointer;
        background:#fff; border:1px solid #bbb;
        border-radius:4px; user-select:none;
        box-shadow:0 0 2px rgba(0,0,0,.15);
        font-family:Arial,sans-serif;
        font-size:16px;
      }
      #altroframeperaltraroba .comando:hover{ background:#f3f3f3; }
      #altroframeperaltraroba .comando i{ line-height:30px; }
    `;
    doc.head.appendChild(style);
  }

  function ensureContainer(doc) {
    if (!doc?.body) return;
    if (doc.getElementById("menu-container")) return;

    const wrap = doc.createElement("div");
    wrap.id = "menu-container";
    wrap.style.position = "fixed";
    wrap.style.top = "4px";
    wrap.style.right = "6px";
    wrap.style.zIndex = "9999999";

    const bar = doc.createElement("div");
    bar.id = "altroframeperaltraroba";
    wrap.appendChild(bar);

    doc.body.appendChild(wrap);
  }

  function fillMenuButtons(doc) {
    const bar = doc.getElementById("altroframeperaltraroba");
    if (!bar) return;

    // evita reiniezione continua
    if (bar.__extremeplugFilled) return;
    bar.__extremeplugFilled = true;

    bar.innerHTML = `
      <div class="comando" id="descLuogo" title="Lente / Descrizione chat"><i class="fa fa-search"></i></div>
      <div class="comando" id="azioniFinestra" title="Azioni nel luogo"><i class="fa fa-bolt"></i></div>
      <div class="comando" id="miascheda" title="Scheda PG"><i class="fa fa-id-card"></i></div>
      <div class="comando" id="apri_editor" title="Editor azione"><i class="fa fa-commenting"></i></div>
      <div class="comando" id="salva_chat" title="Salva chat"><i class="fa fa-save"></i></div>
      <div class="comando" id="scelto_forum" title="Bacheca"><i class="fa fa-comments"></i></div>
      <div class="comando" id="leggiposta" title="Leggi posta"><i class="fa fa-envelope-open"></i></div>
      <div class="comando" id="scriviposta" title="Scrivi posta"><i class="fa fa-paper-plane"></i></div>
      <div class="comando" id="gest_Chat" title="Gestionale"><i class="fa fa-bookmark"></i></div>
      <div class="comando" id="regole" title="Regolamenti"><i class="fa fa-gavel"></i></div>
      <div class="comando" id="lotInforma" title="Lot Informa"><i class="fa fa-newspaper-o"></i></div>
      <div class="comando" id="banca" title="Banca"><i class="fa fa-money"></i></div>
      <div class="comando" id="mappaTest" title="Mappa testuale"><i class="fa fa-map"></i></div>
    `;

    debugLog("[MENU] injected (safe)");
  }

  function renderOnce() {
    // SOLO top window, SOLO frameset host
    if (w.top !== w) return;
    if (!isFramesetHostDocument(w.document)) return;

    const resultWin = w.top?.result;
    if (!resultWin?.document) return;

    const targetWin = getResultTargetWindow(resultWin);
    if (!targetWin?.document) return;

    const doc = targetWin.document;
    if (!doc.body) return;

    // salva doc target per bindings
    w.ExtremePlug.menu._lastTargetDoc = doc;
    // forza rebind sul doc nuovo/riscritto
    doc.__extremeplugBound = false;

    ensureFontAwesome(doc);
    ensureMenuStyle(doc);
    ensureContainer(doc);
    fillMenuButtons(doc);

    // rebind eventi
    if (typeof w.setupEventiPlugin === "function") {
      w.setupEventiPlugin();
    }
  }

  function ensureMenuInResult() {
    if (w.ExtremePlug.menu._booted) return;
    w.ExtremePlug.menu._booted = true;

    let last = 0;
    const tick = () => {
      const now = Date.now();
      if (now - last < 800) return; // throttle forte
      last = now;

      try {
        renderOnce();
      } catch (e) {
        console.error("[ExtremePlug][menu] renderOnce error:", e);
      }
    };

    // parte “tardi” per non interferire col load del frameset
    setTimeout(() => {
      tick();
      setInterval(tick, 900);
    }, 600);
  }

  w.ExtremePlug.menu.ensureMenuInResult = ensureMenuInResult;
})(window);
