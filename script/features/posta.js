// script/features/posta.js


(function (w) {
  // =========================================================
  // HARD INIT (ordine caricamento-safe)
  // =========================================================
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.posta = w.ExtremePlug.features.posta || {};
  const postaAPI = w.ExtremePlug.features.posta;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // =========================================================
  // Config
  // =========================================================
  const START_URL = "https://www.extremelot.eu/proc/posta/leggilaposta.asp";
  const SCRIVI_BASE = "https://www.extremelot.eu/proc/posta/scrivialtri.asp";

  // Dialog IDs
  const VIEWER_ID = "ep-dialog-posta-viewer";
  const COMPOSE_ID = "ep-dialog-posta-compose";

  // iframe IDs
  const VIEW_IFR_ID = "ep-posta-view-iframe";
  const COMP_IFR_ID = "ep-posta-compose-iframe";

  // Viewer size (come vecchio)
  const VIEW_W = 900;
  const VIEW_H = 550;

  // Composer size
  const COMP_W = 950;
  const COMP_H = 650;

  // Frame name richiesto da LOT (self.name must be "result" or "bdx")
  const REQUIRED_FRAME_NAME = "bdx";

  // =========================================================
  // UI DOC selection (frame-safe + visibility aware)
  // =========================================================
  function isFramesetDoc(doc) {
    try {
      const b = doc?.body;
      if (!b) return true;
      const tag = (b.tagName || "").toUpperCase();
      if (tag === "FRAMESET") return true;
      if (doc.querySelector("frameset")) return true;
      return false;
    } catch (_) {
      return true;
    }
  }

  function getVisibleArea(win) {
    try {
      const fe = win.frameElement;
      if (!fe) {
        const vw = Math.max(0, win.innerWidth || 0);
        const vh = Math.max(0, win.innerHeight || 0);
        return vw * vh;
      }
      const cs = win.getComputedStyle(fe);
      if (cs.display === "none" || cs.visibility === "hidden") return 0;
      const r = fe.getBoundingClientRect();
      return Math.max(0, r.width) * Math.max(0, r.height);
    } catch (_) {
      return 0;
    }
  }

  function getUiDoc() {
    // 0) doc target del menu (se disponibile)
    try {
      const cached = w.ExtremePlug?.menu?._lastTargetDoc;
      if (cached?.body && !isFramesetDoc(cached)) return cached;
    } catch (_) {}

    // 1) preferisci top.result
    try {
      const d = w.top?.result?.document;
      if (d?.body && !isFramesetDoc(d)) return d;
    } catch (_) {}

    // 2) scegli frame visibile più grande
    try {
      const best = { doc: null, score: 0, url: "" };
      const visit = (win) => {
        let doc = null;
        try { doc = win.document; } catch (_) { doc = null; }
        if (doc?.body && !isFramesetDoc(doc)) {
          const area = getVisibleArea(win);
          const url = doc.URL || "";
          const boost =
            (url.includes("/proc/") ? 1.25 : 1.0) *
            (url.includes("/lotnew/") ? 1.10 : 1.0);
          const score = area * boost;
          if (score > best.score) {
            best.doc = doc;
            best.score = score;
            best.url = url;
          }
        }
        try {
          for (let i = 0; i < win.frames.length; i++) visit(win.frames[i]);
        } catch (_) {}
      };
      visit(w.top);
      if (best.doc?.body) return best.doc;
    } catch (_) {}

    // 3) fallback
    try {
      if (w.document?.body && !isFramesetDoc(w.document)) return w.document;
    } catch (_) {}

    return null;
  }

  function get$ForDoc(doc) {
    try {
      return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  // =========================================================
  // PG name from frame logo (come scheda.js)
  // =========================================================
  function getOwnPgName() {
    const n1 = w.ExtremePlug?.pg?.getName?.();
    if (n1) return n1;

    try {
      const fw = w.top?.frames?.logo;
      const el = fw?.document?.querySelector("input[name='player']");
      const v = el?.value;
      return (v && String(v).trim()) ? String(v).trim() : null;
    } catch (_) {
      return null;
    }
  }

  function waitOwnPgName(maxAttempts, delayMs) {
    return new Promise((resolve) => {
      const tick = (n) => {
        const name = getOwnPgName();
        debugLog("[POSTA] PG name check", { attempt: maxAttempts - n, name });
        if (name) return resolve(name);
        if (n <= 0) return resolve(null);
        setTimeout(() => tick(n - 1), delayMs);
      };
      tick(maxAttempts);
    });
  }

  async function buildScriviUrlWithNomepg() {
    const pg = await waitOwnPgName(12, 120);
    if (!pg) return SCRIVI_BASE;
    return SCRIVI_BASE + "?nomepg=" + encodeURIComponent(pg);
  }

  // =========================================================
  // Required stub frame: parent.frames['bsx'].document.posta.src
  // =========================================================
  function ensureBxsFrame(doc) {
    try {
      if (!doc?.body) return;

      const existing =
        doc.querySelector('iframe[name="bsx"], frame[name="bsx"]') ||
        (doc.defaultView && doc.defaultView.frames && doc.defaultView.frames["bsx"]);
      if (existing) return;

      const ifr = doc.createElement("iframe");
      ifr.name = "bsx";
      ifr.id = "ep-bsx";

      ifr.style.position = "fixed";
      ifr.style.left = "-99999px";
      ifr.style.top = "-99999px";
      ifr.style.width = "1px";
      ifr.style.height = "1px";
      ifr.style.opacity = "0";
      ifr.style.pointerEvents = "none";
      ifr.setAttribute("aria-hidden", "true");

      doc.body.appendChild(ifr);

      const bdoc = ifr.contentDocument;
      if (!bdoc) return;

      bdoc.open();
      bdoc.write(`<!doctype html><html><head><meta charset="utf-8"></head>
        <body>
          <img name="posta" id="posta" src="https://www.extremelot.eu/lotnew/img/skin/neropietra/posta_off.jpg">
        </body></html>`);
      bdoc.close();

      debugLog("[POSTA] bsx frame stub creato");
    } catch (e) {
      console.warn("[POSTA] ensureBxsFrame failed", e);
    }
  }

  // =========================================================
  // URL helpers
  // =========================================================
  function baseFromUrl(u) {
    try {
      const x = new URL(u);
      x.pathname = x.pathname.replace(/[^/]+$/, "");
      return x.origin + x.pathname;
    } catch (_) {
      return "https://www.extremelot.eu/proc/posta/";
    }
  }

  function absUrl(href, baseHref) {
    try {
      return new URL(href, baseHref).href;
    } catch (_) {
      return null;
    }
  }

  function isExtremelotAsp(u) {
    try {
      const x = new URL(u);
      return x.hostname.includes("extremelot.eu") && x.pathname.toLowerCase().endsWith(".asp");
    } catch (_) {
      return false;
    }
  }

  function looksBlocked(html) {
    return /OPERAZIONE\s+NON\s+CONSENTITA/i.test(String(html));
  }

  function isComposeUrl(u) {
    const s = String(u).toLowerCase();
    return (
      s.includes("scrivialtri.asp") ||
      s.includes("scriviposta.asp") ||
      s.includes("scrivi") ||
      s.includes("rispondi") ||
      s.includes("apriposta.asp")
    );
  }

  // =========================================================
  // CSS + Titlebar Controls (opacity + minimize + close)
  // =========================================================
  function ensurePostaStyle(doc) {
    if (!doc?.head || doc.getElementById("extremeplug-posta-style")) return;

    const st = doc.createElement("style");
    st.id = "extremeplug-posta-style";
    st.textContent = `
      .ui-dialog.ep-posta-ui{ z-index: 9999999 !important; }
      .ui-widget-overlay{ z-index: 9999998 !important; }

      .ui-dialog.ep-posta-ui{
        background: #f8e9aa !important;
        border: 3px solid #6e0000 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 10px 40px rgba(0,0,0,.35) !important;
      }

      .ui-dialog.ep-posta-ui .ui-dialog-titlebar{
        background: #6e0000 !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(0,0,0,.55) !important;
        border-radius: 0 !important;
        padding: 4px 10px !important;
        min-height: 34px !important;
        position: relative !important;
        user-select: none !important;
      }

      .ui-dialog.ep-posta-ui .ui-dialog-title{
        color:#fff !important;
        font-weight:700 !important;
        font-size:13px !important;
        line-height:20px !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.45) !important;
      }

      .ui-dialog.ep-posta-ui .ui-dialog-content{
        padding:0 !important;
        margin:0 !important;
        overflow:hidden !important;
        background:#000 !important;
      }

      .ep-posta-iframe{
        width:100%;
        height:100%;
        border:0;
        display:block;
        background:#f8e9aa;
      }

      /* ====== titlebar controls in stile overlay ====== */
      .ui-dialog.ep-posta-ui .ep-title-controls{
        position:absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        display:flex;
        align-items:center;
        gap:10px;
        z-index: 2;
      }

      .ui-dialog.ep-posta-ui .ep-opacity-wrap{
        display:flex;
        align-items:center;
        gap:6px;
        color:#fff;
        font-size:12px;
        opacity:.95;
        white-space: nowrap;
      }

      .ui-dialog.ep-posta-ui input.ep-opacity{
        width:120px;
        height: 12px;
        cursor: pointer;
      }

      .ui-dialog.ep-posta-ui .ep-titlebtn{
        width: 26px;
        height: 18px;
        border-radius: 3px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        user-select:none;
        color:#fff;
        font-weight:800;
        line-height: 1;
        opacity:.95;
      }
      .ui-dialog.ep-posta-ui .ep-titlebtn:hover{
        background: rgba(255,255,255,.10);
      }

      /* nascondi testo bottone close nativo */
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close .ui-button-text,
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close .ui-dialog-titlebar-close-text{
        display:none !important;
      }
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close{
        width: 26px !important;
        height: 18px !important;
        border: 0 !important;
        border-radius: 3px !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close:hover{
        background: rgba(255,255,255,.10) !important;
      }
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close .ui-icon{
        display:none !important;
      }
      .ui-dialog.ep-posta-ui .ui-dialog-titlebar-close::before{
        content: "✕";
        color: #fff;
        font-weight: 800;
        font-size: 14px;
        line-height: 18px;
        display:block;
        text-align:center;
        width: 26px;
        height: 18px;
      }
    `;
    doc.head.appendChild(st);
  }

  // controls per dialog: slider opacity + minimize + close
  function addTitleControls(doc, $, $dlg, key) {
    try {
      const $wrap = $dlg.closest(".ui-dialog");
      if (!$wrap.length) return;

      const $bar = $wrap.find(".ui-dialog-titlebar");
      if (!$bar.length) return;

      // evita doppioni
      if ($bar.find(".ep-title-controls").length) return;

      const controls = doc.createElement("div");
      controls.className = "ep-title-controls";

      // opacity
      const opWrap = doc.createElement("div");
      opWrap.className = "ep-opacity-wrap";
      opWrap.title = "Opacità";

      const opLabel = doc.createElement("span");
      opLabel.textContent = "Opacity";

      const op = doc.createElement("input");
      op.className = "ep-opacity";
      op.type = "range";
      op.min = "25";
      op.max = "100";
      op.value = "100";

      opWrap.appendChild(opLabel);
      opWrap.appendChild(op);

      // minimize
      const btnMin = doc.createElement("div");
      btnMin.className = "ep-titlebtn ep-minbtn";
      btnMin.title = "Minimizza";
      btnMin.textContent = "–";

      // close (usa close dialog)
      const btnClose = doc.createElement("div");
      btnClose.className = "ep-titlebtn ep-xbtn";
      btnClose.title = "Chiudi";
      btnClose.textContent = "✕";

      controls.appendChild(opWrap);
      controls.appendChild(btnMin);
      controls.appendChild(btnClose);

      $bar.append(controls);

      // stato per minimize
      const stateKey = "ep_posta_state_" + key;
      const win = doc.defaultView || w.window;

      const saveState = () => {
        const rect = $wrap[0].getBoundingClientRect();
        const st = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: parseFloat($wrap.css("opacity") || "1") || 1,
          minimized: false,
        };
        $wrap.data(stateKey, st);
      };

      const restoreState = () => {
        const st = $wrap.data(stateKey);
        if (!st) return;
        $wrap.css({
          left: Math.round(st.left) + "px",
          top: Math.round(st.top) + "px",
          width: Math.round(st.width) + "px",
          height: Math.round(st.height) + "px",
          opacity: st.opacity,
          position: "fixed",
        });
      };

      // inizializza opacity applicata al wrap
      op.addEventListener("input", (e) => {
        try { e.stopPropagation(); } catch (_) {}
        const v = Math.max(0.25, Math.min(1, Number(op.value) / 100));
        $wrap.css("opacity", String(v));
        // salva ultimo valore
        const st = $wrap.data(stateKey) || {};
        st.opacity = v;
        $wrap.data(stateKey, st);
      });
      op.addEventListener("mousedown", (e) => { try { e.stopPropagation(); } catch (_) {} });

      // minimize: riduci a titlebar e parcheggia in basso-destra (senza toccare altri dialog)
      btnMin.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const st = $wrap.data(stateKey) || {};
        const isMin = !!st.minimized;

        if (!isMin) {
          saveState();
          const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 34;

          // nascondi contenuto e riduci
          $dlg.hide();

          // posizione “dock” basso-destra ma SENZA spostare altri (solo questo wrap)
          const vw = Math.max(320, win.innerWidth || 0);
          const vh = Math.max(240, win.innerHeight || 0);

          const minW = 460;
          const pad = 12;

          $wrap.css({
            position: "fixed",
            width: minW + "px",
            height: (titleH + 2) + "px",
            left: Math.max(pad, vw - minW - pad) + "px",
            top: Math.max(pad, vh - (titleH + 2) - pad) + "px",
          });

          st.minimized = true;
          $wrap.data(stateKey, st);

          btnMin.textContent = "▢";
          btnMin.title = "Ripristina";
        } else {
          // restore
          st.minimized = false;
          $wrap.data(stateKey, st);

          restoreState();
          $dlg.show();

          btnMin.textContent = "–";
          btnMin.title = "Minimizza";
        }
      });

      // close: chiude SOLO questo dialog
      btnClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { $dlg.dialog("close"); } catch (_) {
          try { $wrap.remove(); } catch (_) {}
        }
      });

      // sposta anche la X nativa dentro i controls (opzionale, estetica)
      try {
        const $nativeClose = $wrap.find(".ui-dialog-titlebar-close").first();
        if ($nativeClose.length) {
          $nativeClose.attr("title", "Chiudi");
          // la appendiamo in coda, ma la tua X custom già c’è
          controls.appendChild($nativeClose[0]);
        }
      } catch (_) {}

      // salva stato iniziale (pos/dim) dopo open
      setTimeout(() => {
        try {
          const st = $wrap.data(stateKey) || {};
          if (!st.opacity) st.opacity = parseFloat($wrap.css("opacity") || "1") || 1;
          if (st.left == null) saveState();
          $wrap.data(stateKey, st);
        } catch (_) {}
      }, 0);
    } catch (e) {
      debugLog("[POSTA] addTitleControls error", { err: String(e?.message || e) });
    }
  }

  function cleanup(doc, $) {
    [VIEWER_ID, COMPOSE_ID].forEach((id) => {
      try {
        const $el = $(doc).find("#" + id);
        if ($el.length && typeof $el.dialog === "function") {
          try { $el.dialog("destroy"); } catch (_) {}
        }
        $el.remove();
      } catch (_) {
        try { doc.getElementById(id)?.remove(); } catch (_) {}
      }
    });
  }

  // =========================================================
  // Fetch + render viewer
  // =========================================================
  let CURRENT_BASE = baseFromUrl(START_URL);

  async function lotFetch(url, options) {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      ...(options || {}),
    });
    const text = await res.text();
    return { res, text };
  }

  function stripScripts(html) {
    return String(html).replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  }

  function renderViewerHtml(doc, html, baseHref) {
    const iframe = doc.getElementById(VIEW_IFR_ID);
    if (!iframe) return;

    const fdoc = iframe.contentDocument;
    if (!fdoc) return;

    const cleaned = stripScripts(html);

    const out =
      "<!doctype html><html><head>" +
      '<meta charset="utf-8">' +
      '<base href="' + baseHref + '">' +
      "</head><body>" +
      cleaned +
      "</body></html>";

    fdoc.open();
    fdoc.write(out);
    fdoc.close();

    installViewerHooks(doc, baseHref);
    debugLog("[POSTA] viewer render ok", { base: baseHref });
  }

  async function navViewerGet(doc, url) {
    const { res, text } = await lotFetch(url, { method: "GET" });
    const finalUrl = res.url || url;

    if (looksBlocked(text)) {
      renderViewerHtml(
        doc,
        "<div style='padding:12px;font-family:verdana;color:#800'>" +
          "<b>Operazione non consentita dal server.</b><br>" +
          "Questo viewer è solo per lettura; per scrivere/rispondere usa i pulsanti che aprono il composer interno." +
          "</div>",
        CURRENT_BASE
      );
      return;
    }

    CURRENT_BASE = baseFromUrl(finalUrl);
    renderViewerHtml(doc, text, CURRENT_BASE);
  }

  function installViewerHooks(uiDoc, baseHref) {
    const iframe = uiDoc.getElementById(VIEW_IFR_ID);
    const fdoc = iframe?.contentDocument;
    if (!fdoc || fdoc.__epPostaHooks) return;
    fdoc.__epPostaHooks = true;

    fdoc.addEventListener(
      "click",
      function (e) {
        const a = e.target?.closest?.("a");
        if (!a) return;

        const href = a.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

        const u = absUrl(href, baseHref);
        if (!u || !isExtremelotAsp(u)) return;

        e.preventDefault?.();
        e.stopPropagation?.();

        if (isComposeUrl(u)) {
          debugLog("[POSTA] compose from viewer:", u);
          openCompose(uiDoc, u);
          return;
        }

        debugLog("[POSTA] viewer nav GET:", u);
        navViewerGet(uiDoc, u);
      },
      true
    );

    fdoc.addEventListener(
      "submit",
      function (e) {
        const form = e.target;
        if (!form || form.tagName?.toLowerCase() !== "form") return;

        const action = form.getAttribute("action") || "";
        const method = (form.getAttribute("method") || "GET").toUpperCase();
        const actionUrl = absUrl(action || "", baseHref) || baseHref;

        if (method === "POST" || isComposeUrl(actionUrl)) {
          e.preventDefault?.();
          e.stopPropagation?.();
          debugLog("[POSTA] submit rerouted to composer:", actionUrl);
          openCompose(uiDoc, actionUrl);
        }
      },
      true
    );

    debugLog("[POSTA] viewer hooks installati");
  }

  // =========================================================
  // Composer dialog (iframe SRC reale, name=bdx)
  // =========================================================
  function openCompose(doc, url) {
    const $ = get$ForDoc(doc);
    if (!doc?.body) return;

    ensureBxsFrame(doc);

    const hasDialog = !!($ && $.fn && typeof $.fn.dialog === "function");
    if (!hasDialog) {
      openComposeFallback(doc, url);
      return;
    }

    ensurePostaStyle(doc);

    let $dlg = $(doc).find("#" + COMPOSE_ID);
    if (!$dlg.length) {
      $(doc.body).append(
        `<div id="${COMPOSE_ID}">
           <iframe id="${COMP_IFR_ID}" class="ep-posta-iframe" name="${REQUIRED_FRAME_NAME}" src="about:blank"></iframe>
         </div>`
      );
      $dlg = $(doc).find("#" + COMPOSE_ID);

      $dlg.dialog({
        title: "Posta - Scrivi / Rispondi",
        width: COMP_W,
        height: COMP_H,
        resizable: true,
        draggable: true,
        modal: false,
        appendTo: $(doc.body),
        position: { my: "center", at: "center", of: doc.defaultView || w.window },
        open: function () {
          try {
            const $wrap = $dlg.closest(".ui-dialog");
            $wrap.addClass("ep-posta-ui");
            try { $wrap.draggable("option", "handle", ".ui-dialog-titlebar"); } catch (_) {}
            addTitleControls(doc, $, $dlg, "compose");
          } catch (_) {}
        },
        close: function () {
          try {
            const ifr = doc.getElementById(COMP_IFR_ID);
            if (ifr) ifr.src = "about:blank";
          } catch (_) {}
        }
      });
    }

    const ifr = doc.getElementById(COMP_IFR_ID);
    if (ifr) {
      ifr.name = REQUIRED_FRAME_NAME;
      ifr.src = url;
    }

    try { $dlg.dialog("open"); } catch (_) {}
    debugLog("[POSTA] compose opened", { url });
  }

  function openComposeFallback(doc, url) {
    let div = doc.getElementById(COMPOSE_ID);
    if (!div) {
      div = doc.createElement("div");
      div.id = COMPOSE_ID;
      div.style.position = "fixed";
      div.style.top = "50%";
      div.style.left = "50%";
      div.style.transform = "translate(-50%, -50%)";
      div.style.width = COMP_W + "px";
      div.style.height = COMP_H + "px";
      div.style.background = "#f8e9aa";
      div.style.border = "3px solid #6e0000";
      div.style.zIndex = "100000";
      div.style.boxShadow = "0 10px 40px rgba(0,0,0,.35)";
      div.style.overflow = "hidden";

      const ifr = doc.createElement("iframe");
      ifr.id = COMP_IFR_ID;
      ifr.className = "ep-posta-iframe";
      ifr.name = REQUIRED_FRAME_NAME;
      ifr.style.width = "100%";
      ifr.style.height = "100%";
      ifr.style.border = "0";
      div.appendChild(ifr);

      doc.body.appendChild(div);
    }
    ensureBxsFrame(doc);
    const ifr = doc.getElementById(COMP_IFR_ID);
    if (ifr) {
      ifr.name = REQUIRED_FRAME_NAME;
      ifr.src = url;
    }
    div.style.display = "block";
    debugLog("[POSTA] compose fallback opened", { url });
  }

  // =========================================================
  // Viewer dialog (iframe about:blank, name=bdx)
  // =========================================================
  function openViewer(doc) {
    const $ = get$ForDoc(doc);
    if (!doc?.body) return;

    const hasDialog = !!($ && $.fn && typeof $.fn.dialog === "function");
    if (!hasDialog) {
      debugLog("[POSTA] abort: jQuery UI dialog missing nel doc UI");
      return;
    }

    ensurePostaStyle(doc);
    cleanup(doc, $);

    ensureBxsFrame(doc);

    $(doc.body).append(
      `<div id="${VIEWER_ID}">
         <iframe id="${VIEW_IFR_ID}" class="ep-posta-iframe" name="${REQUIRED_FRAME_NAME}" src="about:blank"></iframe>
       </div>`
    );

    const $dlg = $(doc).find("#" + VIEWER_ID);

    $dlg.dialog({
      title: "Posta",
      width: VIEW_W,
      height: VIEW_H,
      resizable: true,
      draggable: true,
      modal: false,
      appendTo: $(doc.body),
      position: { my: "center", at: "center", of: doc.defaultView || w.window },
      open: function () {
        try {
          const $wrap = $dlg.closest(".ui-dialog");
          $wrap.addClass("ep-posta-ui");
          try { $wrap.draggable("option", "handle", ".ui-dialog-titlebar"); } catch (_) {}
          addTitleControls(doc, $, $dlg, "viewer");
        } catch (_) {}

        navViewerGet(doc, START_URL).catch((e) => console.error("[POSTA] nav start err", e));
      },
      close: function () {
        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
      }
    });

    debugLog("[POSTA] viewer open");
  }

  // =========================================================
  // API pubblica
  // =========================================================
  postaAPI.open = function () {
    const doc = getUiDoc();
    if (!doc?.body) return;
    openViewer(doc);
  };

  postaAPI.scrivi = async function () {
    const doc = getUiDoc();
    if (!doc?.body) return;

    const url = await buildScriviUrlWithNomepg();
    openCompose(doc, url); // SOLO composer
  };

  // Export anche su top (utile se chiamato da altri file/frame)
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.posta = postaAPI;
    }
  } catch (_) {}

  debugLog("[POSTA] loaded");
})(window);
