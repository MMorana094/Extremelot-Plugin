// script/ui/menu.js

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.menu = w.ExtremePlug.menu || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function isFramesetHostDocument(doc) {
    try {
      return !!doc.querySelector("frameset") || !!doc.querySelector("frame[name='result']");
    } catch (e) {
      debugLog("[MENU] isFramesetHostDocument error:", e);
      return false;
    }
  }

  function getScelteTargetWindow() {
    // Nel frameset LOT spesso esiste top.scelte come frame con i bottoni/azioni
    const sw = w.top?.scelte;
    if (sw?.document) return sw;
    return null;
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
        padding:1px; border-radius:6px;
      }

      #altroframeperaltraroba .comando{
        width:20px; height:20px; line-height:20px;
        text-align:center; cursor:pointer;
        border-radius:4px; user-select:none;
        box-shadow:0 0 2px rgba(0,0,0,.15);
        font-family:Arial,sans-serif;
        font-size:16px;
      }
      #altroframeperaltraroba .comando:hover{ background:#f3f3f3; }
      #altroframeperaltraroba .comando i{ line-height:20px; }
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

    if (bar.__extremeplugFilled) return;
    bar.__extremeplugFilled = true;

    bar.innerHTML = `
      <div class="comando" id="salva_chat" title="Salva chat"><img src='https://tagete.altervista.org/plugin/salva.png'></div>
      <div class='comando' id='aprisimboli' title='Apri i simboli'><img src='https://tagete.altervista.org/plugin/simboli.png'></div>
      <div class="comando" id="descLuogo" title="Lente / Descrizione chat"><img src='http://www.extremelot.eu/proc/img/_descr.gif'></div>
      <div class='comando' id='dovegioco' title='Dove vuoi giocare oggi?'><img src='https://tagete.altervista.org/plugin/dove.png'></div>
      <div class="comando" id="azioniFinestra" title="Azioni nel luogo"><img src='https://tagete.altervista.org/plugin/azioni.png'></i></div>
      <div class="comando" id="mappaTest" title="Mappa testuale"><img src='https://tagete.altervista.org/plugin/mappa.png'></div>
      <div class="comando" id="miascheda" title="Scheda PG"><img src='https://tagete.altervista.org/plugin/scheda.png'></div>
      <div class="comando" id="lotInforma" title="Lot Informa"><img src='https://tagete.altervista.org/plugin/informa.png'></div>
      <div class="comando" id="scelto_forum" title="Bacheca"><img src='https://tagete.altervista.org/plugin/bacheca.png'></div>
      <div class='comando' id='apri_online' title='Elenco online'><img src='https://tagete.altervista.org/plugin/presenti.png'></div>
      <div class="comando" id="leggiposta" title="Leggi posta"><img src='https://tagete.altervista.org/plugin/postai.png'></div>
      <div class="comando" id="scriviposta" title="Scrivi posta"><img src='https://tagete.altervista.org/plugin/scrivi.png'></div>
      <div class="comando" id="banca" title="Banca"><img src='https://tagete.altervista.org/plugin/banca.png'></div>
      <div class="comando" id="regole" title="Regolamenti"><img src='https://tagete.altervista.org/plugin/regole.png'></div>
      <div class="comando" id="apri_editor" title="Editor azione"><img src='https://tagete.altervista.org/plugin/chat.png'></div>
      <div class="comando" id="gest_Chat" title="Gestionale"><img src='https://tagete.altervista.org/plugin/gestione.png'></div>
      <div class="comando" id="link_bookmark" title="Link Bookmark"><img src='https://tagete.altervista.org/plugin/link.png'></i></div>
    `;

    debugLog("[MENU] injected (scelte)");
  }

  function renderOnce() {
    if (w.top !== w) return;
    if (!isFramesetHostDocument(w.document)) return;

    // ✅ target: frame "scelte"
    const targetWin = getScelteTargetWindow();
    if (!targetWin?.document) return;

    const doc = targetWin.document;
    if (!doc.body) return;

    // salva doc target per bindings
    w.ExtremePlug.menu._lastTargetDoc = doc;
    doc.__extremeplugBound = false;

    ensureFontAwesome(doc);
    ensureMenuStyle(doc);
    ensureContainer(doc);
    fillMenuButtons(doc);

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
      if (now - last < 800) return;
      last = now;

      try {
        renderOnce();
      } catch (e) {
        debugLog("[MENU] renderOnce error:", e);
      }
    };

    setTimeout(() => {
      tick();
      setInterval(tick, 900);
    }, 600);
  }

  w.ExtremePlug.menu.ensureMenuInResult = ensureMenuInResult;
})(window);
