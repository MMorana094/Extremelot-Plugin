// script/features/scheda.js
// Scheda PG: dialog base (Sì/No + Cerca) + Viewer iframe stile “Scheda”

(function (w) {
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};
  debugLog("[scheda] loaded");

  // Ultimo contesto UI valido (doc + jQuery) per riaprire viewer dopo click
  let LAST_UI_DOC = null;
  let LAST_UI_$ = null;

  const SCHEDA_BASE_URL = "https://www.extremelot.eu/proc/schedaPG/scheda.asp?ID=";

  // Viewer fisso richiesto
  const VIEWER_W = 1000;
  const VIEWER_H = 600;

  // =========================================================
  // getUiDoc() – FRAME-SAFE e “VISIBILITY-AWARE”
  // In LOT alcuni frame sono tecnici o nascosti: il dialog può finire lì e non vedersi.
  // Strategia:
  //  0) se LAST_UI_DOC è ancora valido e il frame è visibile/grande, riusalo
  //  1) altrimenti cerca ricorsivamente il frame accessibile con area più grande (visibile)
  //     con una leggera preferenza per URL /proc/
  //  2) fallback su documento corrente
  // =========================================================
  function getUiDoc() {
  // helper: il doc è un frameset host? (quindi NON va bene come UI container)
  function isFramesetDoc(doc) {
    try {
      const b = doc?.body;
      if (!b) return true;
      const tag = (b.tagName || "").toUpperCase();
      if (tag === "FRAMESET") return true;
      // alcuni frameset hanno body "strano": controlliamo anche presence frameset
      if (doc.querySelector("frameset")) return true;
      return false;
    } catch (_) {
      return true;
    }
  }

  // helper: area visibile del frame
  function getVisibleArea(win) {
    try {
      const fe = win.frameElement;
      if (!fe) {
        // top window
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

  // (0) riusa LAST_UI_DOC se è ancora valido, visibile e NON frameset
  try {
    if (LAST_UI_DOC?.body && !isFramesetDoc(LAST_UI_DOC)) {
      const win = LAST_UI_DOC.defaultView;
      const area = getVisibleArea(win);
      if (area > 200 * 200) return LAST_UI_DOC;
    }
  } catch (_) {}

  // (1) cerca ricorsivamente il frame visibile più grande, MA scarta frameset host
  try {
    const best = { doc: null, score: 0, url: "" };

    const visit = (win) => {
      let doc = null;
      try { doc = win.document; } catch (_) { doc = null; }

      if (doc?.body && !isFramesetDoc(doc)) {
        const area = getVisibleArea(win);
        const url = doc.URL || "";

        // preferenza leggera per /proc/ (chat/mappa) e per /lotnew/ pagine interne
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

      // ricorsione
      try {
        for (let i = 0; i < win.frames.length; i++) visit(win.frames[i]);
      } catch (_) {}
    };

    visit(w.top);

    if (best.doc?.body) {
      debugLog("[vedischeda] getUiDoc selected (non-frameset)", {
        url: best.url,
        score: best.score
      });
      return best.doc;
    }
  } catch (_) {}

  // (2) fallback: documento corrente solo se NON frameset
  try {
    if (w.document?.body && !isFramesetDoc(w.document)) return w.document;
  } catch (_) {}

  return null;
}


  function appendToUiWhenReady(fn) {
    const t = setInterval(() => {
      try {
        const doc = getUiDoc();
        if (doc?.body) {
          clearInterval(t);
          debugLog("[vedischeda] UI doc ready", {
            url: doc.URL,
            hasBody: !!doc.body,
            readyState: doc.readyState
          });
          fn(doc);
        }
      } catch (_) {}
    }, 100);
  }

  function get$ForDoc(doc) {
    try {
      return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  // =========================================================
  // Posizionamento robusto (chat può avere overflow/scroll non standard)
  // =========================================================
  function forceDialogFixedCenter(doc, $dlg) {
    try {
      const $wrap = $dlg.closest(".ui-dialog");
      const win = doc?.defaultView || w.window;
      if (!$wrap.length || !win) return;

      $wrap.css({ position: "fixed", left: "0px", top: "0px" });

      const vw = Math.max(320, win.innerWidth || 0);
      const vh = Math.max(240, win.innerHeight || 0);

      const ww = $wrap.outerWidth() || 0;
      const wh = $wrap.outerHeight() || 0;

      const left = Math.max(6, Math.round((vw - ww) / 2));
      const top = Math.max(6, Math.round((vh - wh) / 2));

      $wrap.css({ left: left + "px", top: top + "px" });
    } catch (_) {}
  }

  // =========================
  // CSS
  // =========================
  function ensureSchedaStyle(doc) {
    if (!doc?.head || doc.getElementById("extremeplug-scheda-style")) return;

    const st = doc.createElement("style");
    st.id = "extremeplug-scheda-style";
    st.textContent = `
      /* Card base (dialog Sì/No + Cerca) */
      .ep-card{
        background:#f6f6f6;
        color:#222;
        border:1px solid #cfcfcf;
        border-radius:12px;
        padding:14px;
        box-shadow:0 6px 20px rgba(0,0,0,.18);
        font-family:Arial,sans-serif;
        font-size:14px;
      }
      .ep-title{ font-size:14px; margin:0 0 10px 0; }
      .ep-row{ display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
      .ep-card button{
        padding:7px 14px;
        border:1px solid #aaa;
        border-radius:8px;
        background:#fff;
        cursor:pointer;
      }
      .ep-card button:hover{ background:#f0f0f0; }
      .ep-input{
        width:100%;
        box-sizing:border-box;
        padding:9px 10px;
        border:1px solid #cfcfcf;
        border-radius:10px;
        background:#fff;
        font-size:14px;
        outline:none;
      }

      /* z-index sempre sopra */
      .ui-dialog.ep-scheda-ui{ z-index: 9999999 !important; }
      .ui-widget-overlay{ z-index: 9999998 !important; }

      /* =========================
         VIEWER (Scheda PG) - stile "Scheda"
         ========================= */

      .ui-dialog.ep-scheda-viewer-ui{
        background: #f8e9aa !important;
        border: 3px solid #6e0000 !important;
        border-radius: 6px !important;
        overflow: hidden !important;

        box-shadow:
          0 10px 28px rgba(0,0,0,.35),
          inset 0 0 0 1px rgba(0,0,0,.65),
          inset 0 0 0 3px rgba(244,227,150,.55) !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar{
        background: #6e0000 !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(0,0,0,.55) !important;
        border-radius: 0 !important;

        padding: 4px 10px !important;
        min-height: 22px !important;
        position: relative !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-title{
        color: #fff !important;
        font-weight: 700 !important;
        font-size: 13px !important;
        line-height: 18px !important;
        text-shadow: 0 1px 0 rgba(0,0,0,.45) !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-content{
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-buttonpane{
        display: none !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: 0 !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-resizable-handle{
        display: none !important;
      }

      .ep-scheda-viewer{
        width: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
      }
      .ep-scheda-iframe{
        width: 100%;
        border: 0;
        display: block;
        background: #000;
      }

      /* ====== controlli titlebar: minimize + opacity slider + close ====== */
      .ui-dialog.ep-scheda-viewer-ui .ep-title-controls{
        position:absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        display:flex;
        align-items:center;
        gap:10px;
        z-index: 2;
      }

      .ui-dialog.ep-scheda-viewer-ui .ep-titlebtn{
        width: 26px;
        height: 18px;
        border-radius: 3px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        user-select:none;
        color:#fff;
        font-weight:700;
        line-height: 1;
        opacity:.95;
      }
      .ui-dialog.ep-scheda-viewer-ui .ep-titlebtn:hover{
        background: rgba(255,255,255,.10);
      }

      .ui-dialog.ep-scheda-viewer-ui .ep-opacity-wrap{
        display:flex;
        align-items:center;
        gap:6px;
        color:#fff;
        font-size:12px;
        opacity:.95;
        white-space: nowrap;
      }
      .ui-dialog.ep-scheda-viewer-ui input.ep-opacity{
        width:120px;
        height: 12px;
        cursor: pointer;
      }

      /* =========================
         CLOSE (viewer): X sempre visibile
         ========================= */
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-button-text,
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-dialog-titlebar-close-text{
        display:none !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close{
        position: static !important;
        right: auto !important;
        top: auto !important;
        transform: none !important;

        width: 26px !important;
        height: 18px !important;
        border: 0 !important;
        border-radius: 3px !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close:hover{
        background: rgba(255,255,255,.10) !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-icon{
        display:none !important;
      }

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close::before{
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

      /* =========================
         DIALOG BASE (SI/NO – CERCA): niente pulsante close
         ========================= */
      .ui-dialog.ep-noclose .ui-dialog-titlebar-close{
        display: none !important;
      }
    `;
    doc.head.appendChild(st);
  }

  function cleanup(doc, $) {
    ["#ep-dialog-scheda", "#ep-dialog-scheda-search", "#ep-dialog-scheda-viewer"].forEach((sel) => {
      try {
        const $el = $(doc).find(sel);
        if ($el.length && typeof $el.dialog === "function") {
          try { $el.dialog("destroy"); } catch (_) {}
        }
        $el.remove();
      } catch (_) {
        try { doc.querySelector(sel)?.remove(); } catch (_) {}
      }
    });
  }

  // =========================
  // PG name: API o fallback (frame logo)
  // =========================
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

  function waitOwnPgName(maxAttempts, delayMs, cb) {
    const name = getOwnPgName();
    debugLog("[vedischeda] PG name check", { attempt: maxAttempts, name });

    if (name) return cb(name);
    if (maxAttempts <= 0) return cb(null);
    setTimeout(() => waitOwnPgName(maxAttempts - 1, delayMs, cb), delayMs);
  }

  // =========================
  // Dialog base (Sì/No e Search) - standard (NO X)
  // =========================
  function openDialogBasic(doc, $, $dlg, title, width, height) {
    $dlg.dialog({
      title: title || "Scheda",
      width: width || 420,
      height: height || "auto",
      resizable: false,
      draggable: true,
      modal: false,
      closeOnEscape: false,      // senza X: chiusura solo via bottoni
      dialogClass: "ep-noclose", // nasconde la X solo qui
      appendTo: $(doc.body),
      position: { my: "center", at: "center", of: doc.defaultView || w.window },
      open: function () {
        try { $dlg.closest(".ui-dialog").addClass("ep-scheda-ui"); } catch (_) {}
        debugLog("[vedischeda] dialog open", { title: title || "Scheda" });

        // center robusto (chat/overflow)
        setTimeout(() => forceDialogFixedCenter(doc, $dlg), 0);

        // recenter su resize della viewport del frame
        try {
          $(doc.defaultView).off("resize.epSchedaBasic").on("resize.epSchedaBasic", () => {
            forceDialogFixedCenter(doc, $dlg);
          });
        } catch (_) {}
      },
      close: function () {
        debugLog("[vedischeda] dialog close", { title: title || "Scheda" });
        try { $(doc.defaultView).off("resize.epSchedaBasic"); } catch (_) {}
        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
      }
    });

    try {
      $dlg.closest(".ui-dialog").draggable("option", "handle", ".ui-dialog-titlebar");
    } catch (_) {}
  }

  // =========================
  // Viewer: controlli titlebar (opacity + minimize + close)
  // =========================
  function addViewerTitleControls(doc, $, $dlg, $wrap, fixedH) {
    const $title = $wrap.find(".ui-dialog-titlebar");
    if (!$title.length) return;

    if ($title.find(".ep-title-controls").length) return;

    const $controls = $(doc.createElement("div"));
    $controls.addClass("ep-title-controls");

    // opacity slider
    const $opWrap = $(doc.createElement("div"));
    $opWrap.addClass("ep-opacity-wrap");
    $opWrap.attr("title", "Opacità frame");

    const $opLabel = $(doc.createElement("span"));
    $opLabel.text("Opacity");

    const $op = $(doc.createElement("input"));
    $op.addClass("ep-opacity");
    $op.attr({ type: "range", min: "20", max: "100", value: "100" });

    $opWrap.append($opLabel, $op);

    // minimize
    const $min = $(doc.createElement("div"));
    $min.addClass("ep-titlebtn ep-minbtn");
    $min.attr("title", "Riduci a icona");
    $min.text("—");

    $controls.append($opWrap, $min);
    $title.append($controls);

    // stato minimize
    $wrap.data("ep_minimized", false);
    $wrap.data("ep_saved_content_h", $dlg.height());
    $wrap.data("ep_fixed_h", fixedH);

    $op.on("input.epOpacity change.epOpacity", function (e) {
      try { e.stopPropagation(); } catch (_) {}
      const v = Number(this.value || 100);
      const op = Math.max(0.2, Math.min(1, v / 100));
      $wrap.css("opacity", op);
    });
    $op.on("mousedown.epNoDrag pointerdown.epNoDrag", function (e) {
      try { e.stopPropagation(); } catch (_) {}
    });

    $min.on("click.epMin", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const minimized = !!$wrap.data("ep_minimized");
      const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 0;

      if (!minimized) {
        $wrap.data("ep_saved_content_h", $dlg.height());
        $dlg.hide();
        $wrap.height(titleH + 2);
        $wrap.data("ep_minimized", true);
        $min.attr("title", "Ripristina").text("▢");
        setTimeout(() => forceDialogFixedCenter(doc, $dlg), 0);
      } else {
        const contentH = Number($wrap.data("ep_saved_content_h")) || 400;
        const fixedH2 = Number($wrap.data("ep_fixed_h")) || 600;

        $dlg.show().height(contentH).css({ overflow: "hidden" });

        const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
        if (iframeEl) iframeEl.style.height = contentH + "px";

        $wrap.height(fixedH2);
        $wrap.data("ep_minimized", false);
        $min.attr("title", "Riduci a icona").text("—");
        setTimeout(() => forceDialogFixedCenter(doc, $dlg), 0);
      }
    });

    // Close: sposta il close nativo dentro i controlli (X via CSS ::before)
    try {
      const $close = $wrap.find(".ui-dialog-titlebar-close").first();
      if ($close.length) {
        $close.attr("title", "Chiudi");
        $controls.append($close);
      }
    } catch (_) {}
  }

  // =========================
  // Dialog VIEWER (Scheda PG) - FRAME FISSO 1000x600
  // =========================
  function openDialogViewer(doc, $, $dlg, title, width, height) {
    const W = Number(width) || VIEWER_W;
    const H = Number(height) || VIEWER_H;

    $dlg.dialog({
      title: title || "Scheda PG",
      width: W,
      height: H,
      resizable: false,
      draggable: true,
      modal: false,
      appendTo: $(doc.body),
      position: { my: "center", at: "center", of: doc.defaultView || w.window },
      open: function () {
        try {
          const $wrap = $dlg.closest(".ui-dialog");
          $wrap.addClass("ep-scheda-ui").addClass("ep-scheda-viewer-ui");

          try { $wrap.draggable("option", "handle", ".ui-dialog-titlebar"); } catch (_) {}

          // altezza contenuto = H - titlebar
          const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 0;
          const borderFix = 2;
          const contentH = Math.max(100, H - titleH - borderFix);

          $dlg.css({ padding: 0, overflow: "hidden" }).height(contentH);

          const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
          if (iframeEl) iframeEl.style.height = contentH + "px";

          addViewerTitleControls(doc, $, $dlg, $wrap, H);

          // center robusto (chat/overflow)
          setTimeout(() => forceDialogFixedCenter(doc, $dlg), 0);

          try {
            $(doc.defaultView).off("resize.epSchedaViewer").on("resize.epSchedaViewer", () => {
              forceDialogFixedCenter(doc, $dlg);
            });
          } catch (_) {}

          debugLog("[vedischeda] viewer open fixed", { title: title || "Scheda PG", W, H, titleH, contentH });
        } catch (e) {
          debugLog("[vedischeda] viewer open fixed (err)", { err: String(e?.message || e) });
        }
      },
      close: function () {
        debugLog("[vedischeda] viewer close", { title: title || "Scheda PG" });
        try { $(doc.defaultView).off("resize.epSchedaViewer"); } catch (_) {}
        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
      }
    });
  }

  // =========================
  // Viewer: apre la scheda nel dialog con iframe
  // =========================
  function openSchedaViewer(pgIdOrName) {
    const doc = LAST_UI_DOC;
    const $ = LAST_UI_$;

    if (!doc || !$ || !doc.body) {
      debugLog("[vedischeda] openSchedaViewer abort: missing UI doc/$");
      return;
    }

    const id = (pgIdOrName || "").toString().trim();
    if (!id) return;

    const url = SCHEDA_BASE_URL + encodeURIComponent(id);
    debugLog("[vedischeda] openSchedaViewer", { id, url });

    cleanup(doc, $);

    $(doc.body).append(`
      <div id="ep-dialog-scheda-viewer">
        <div class="ep-scheda-viewer">
          <iframe class="ep-scheda-iframe" src="${url}" loading="eager"></iframe>
        </div>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda-viewer");
    openDialogViewer(doc, $, $dlg, `Scheda PG: ${id}`, VIEWER_W, VIEWER_H);
  }

  // =========================
  // Dialog 2: ricerca
  // =========================
  function showSearchDialog(doc, $) {
    debugLog("[vedischeda] showSearchDialog");
    cleanup(doc, $);

    $(doc.body).append(`
      <div id="ep-dialog-scheda-search">
        <div class="ep-card">
          <div class="ep-title">Inserire il nome del pg da cercare</div>
          <input id="ep-scheda-search-input" class="ep-input" type="text" autocomplete="off" />
          <div class="ep-row">
            <button type="button" id="ep-scheda-search-ok">OK</button>
            <button type="button" id="ep-scheda-search-cancel">Annulla</button>
          </div>
        </div>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda-search");
    const $input = $(doc).find("#ep-scheda-search-input");

    openDialogBasic(doc, $, $dlg, "Cerca scheda", 460, "auto");

    try { $input.focus(); } catch (_) {}

    $(doc).find("#ep-scheda-search-ok").off("click.scheda").on("click.scheda", function () {
      const name = ($input.val() || "").toString().trim();
      debugLog("[vedischeda] SEARCH OK", { name });
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }
      if (name) openSchedaViewer(name);
    });

    $(doc).find("#ep-scheda-search-cancel").off("click.scheda").on("click.scheda", function () {
      debugLog("[vedischeda] SEARCH CANCEL");
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }
    });

    $input.off("keydown.scheda").on("keydown.scheda", function (e) {
      const k = e.key || e.which;
      if (k === "Enter" || k === 13) { e.preventDefault(); $(doc).find("#ep-scheda-search-ok").trigger("click"); }
      if (k === "Escape" || k === "Esc" || k === 27) { e.preventDefault(); $(doc).find("#ep-scheda-search-cancel").trigger("click"); }
    });
  }

  // =========================
  // Dialog 1: Sì / No
  // =========================
  function showMainDialog(doc, $) {
    debugLog("[vedischeda] showMainDialog");
    cleanup(doc, $);

    $(doc.body).append(`
      <div id="ep-dialog-scheda">
        <div class="ep-card">
          <div class="ep-title">Vuoi visitare la tua scheda?</div>
          <div class="ep-row">
            <button type="button" id="ep-scheda-yes">Sì</button>
            <button type="button" id="ep-scheda-no">No</button>
          </div>
        </div>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda");
    openDialogBasic(doc, $, $dlg, "Scheda personaggio", 420, "auto");

    $(doc).find("#ep-scheda-yes").off("click.scheda").on("click.scheda", function () {
      debugLog("[vedischeda] CLICK: Si");
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }

      waitOwnPgName(12, 120, (name) => {
        debugLog("[vedischeda] own name resolved", { name });
        if (name) openSchedaViewer(name);
        else showSearchDialog(doc, $);
      });
    });

    $(doc).find("#ep-scheda-no").off("click.scheda").on("click.scheda", function () {
      debugLog("[vedischeda] CLICK: No");
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }
      showSearchDialog(doc, $);
    });
  }

  // =========================
  // API pubblica
  // =========================
  w.vedischeda = function () {
    debugLog("[vedischeda] invoked");

    appendToUiWhenReady((doc) => {
      const $ = get$ForDoc(doc);

      // salva contesto UI per viewer
      LAST_UI_DOC = doc;
      LAST_UI_$ = $;

      if (!doc?.body || !$) {
        debugLog("[vedischeda] abort: missing doc/body/$", {
          url: doc?.URL || "",
          hasBody: !!doc?.body,
          has$: !!$
        });
        return;
      }

      const hasDialog = !!($.fn && typeof $.fn.dialog === "function");
      debugLog("[vedischeda] env", {
        url: doc.URL,
        hasJQuery: !!$,
        hasDialog
      });

      if (!hasDialog) {
        debugLog("[vedischeda] abort: jQuery UI dialog missing", { url: doc.URL });
        return;
      }

      ensureSchedaStyle(doc);
      showMainDialog(doc, $);
    });
  };

  // =========================================================
  // PATCH: publish su TOP (persistente tra reload interni dei frame)
  // =========================================================
  try {
    if (w.top && w.top !== w) {
      w.top.vedischeda = w.vedischeda;
    }
  } catch (_) {}

})(window);
