// script/features/scheda.js
// Dipendenze:
//  - script/ui/getUiDoc.js (ExtremePlug.ui.getUiDoc, ExtremePlug.ui.get$ForDoc)
//  - core/pgData.js (ExtremePlug.pg.getName, ExtremePlug.pg.waitName)
//  - script/ui/overlay.js (ExtremePlug.ui.overlay.jqui)
//  - script/security/iframeGuard.js (ExtremePlug.security.iframeGuard)
//  - script/security/iframeGuard.policies.scheda.js (ExtremePlug.security.iframeGuardPolicies.scheda)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};
  debugLog("[scheda] loaded");

  let LAST_UI_DOC = null;
  let LAST_UI_$ = null;

  const SCHEDA_BASE_URL = "https://www.extremelot.eu/proc/schedaPG/scheda.asp?ID=";
  const VIEWER_W = 1000;
  const VIEWER_H = 600;

  // posizione viewer (runtime)
  let LAST_VIEWER_POS = null; // { left, top }
  const VIEWER_PAD = 12;
  const VIEWER_TOP_PAD = 60;

  // =========================================================
  // UI HOST (script/ui/getUiDoc.js)
  // =========================================================
  function appendToUiWhenReady(fn) {
    const t = setInterval(() => {
      try {
        const getUiDoc = w.ExtremePlug?.ui?.getUiDoc;
        if (typeof getUiDoc !== "function") {
          debugLog("[scheda] abort: getUiDoc missing");
          clearInterval(t);
          return;
        }
        const doc = getUiDoc();
        if (doc?.body) {
          clearInterval(t);
          fn(doc);
        }
      } catch (_) {}
    }, 100);
  }

  function get$ForDoc(doc) {
    const fn = w.ExtremePlug?.ui?.get$ForDoc;
    if (typeof fn === "function") return fn(doc);
    debugLog("[scheda] warn: get$ForDoc missing");
    try {
      return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  // =========================================================
  // overlay.js (jqui)
  // =========================================================
  function getJqui() {
    return w.ExtremePlug?.ui?.overlay?.jqui || null;
  }

  // =========================================================
  // Position helpers
  // =========================================================
  function getDefaultViewerPos(doc) {
    try {
      const win = doc?.defaultView || w.window;
      const vw = Math.max(320, Number(win?.innerWidth || 1200));
      const vh = Math.max(240, Number(win?.innerHeight || 800));

      // ✅ alto-destra di default
      const left = Math.max(VIEWER_PAD, vw - VIEWER_W - VIEWER_PAD);
      const top = Math.max(
        VIEWER_PAD,
        Math.min(VIEWER_TOP_PAD, vh - VIEWER_H - VIEWER_PAD)
      );

      return { left: Math.round(left), top: Math.round(top) };
    } catch (_) {
      return { left: VIEWER_PAD, top: VIEWER_TOP_PAD };
    }
  }

  function rememberViewerPos(doc, $) {
    try {
      const $dlg = $(doc).find("#ep-dialog-scheda-viewer");
      if (!$dlg.length) return;

      const $wrap = $dlg.closest(".ui-dialog");
      if (!$wrap.length) return;

      // se minimizzato, non memorizzare la posizione dock
      const jqui = getJqui();
      if (jqui && jqui.isMinimized && jqui.isMinimized($dlg, "scheda_viewer")) return;

      const r = $wrap[0].getBoundingClientRect();
      if (!r) return;

      LAST_VIEWER_POS = { left: Math.round(r.left), top: Math.round(r.top) };
    } catch (_) {}
  }

  // =========================================================
  // Styles
  // =========================================================
  function ensureStyles(doc) {
    const jqui = getJqui();
    if (!jqui || !doc?.head) return;

    // viewer
    jqui.ensureDialogStyle(doc, {
      ns: "scheda_viewer",
      dialogClass: "ep-scheda-viewer-ui",
      bg: "#000",
      border: "#6e0000",
      titleBg: "#6e0000",
      titleColor: "#fff",
      // hideButtonPane non necessario qui (di solito non ci sono pulsanti)
    });

    jqui.ensureIframeFill(doc, {
      ns: "scheda_viewer",
      iframeClass: "ep-scheda-iframe",
      dialogClass: "ep-scheda-viewer-ui",
      bg: "#000",
    });

    // basic
    jqui.ensureDialogStyle(doc, {
      ns: "scheda_basic",
      dialogClass: "ep-scheda-basic-ui",
      bg: "#f6f6f6",
      border: "#cfcfcf",
      titleBg: "#6e0000",
      titleColor: "#fff",
      hideButtonPane: true, // ✅ ora centralizzato in overlay.js
    });

    // ✅ extra scheda (card)
    const styleId = "extremeplug-scheda-extra";
    if (!doc.getElementById(styleId)) {
      const st = doc.createElement("style");
      st.id = styleId;
      st.textContent = `
        .ep-card{
          background:#f6f6f6;color:#222;border:1px solid #cfcfcf;border-radius:12px;
          padding:14px;box-shadow:0 6px 20px rgba(0,0,0,.18);
          font-family:Arial,sans-serif;font-size:14px;
        }
        .ep-title{margin:0 0 10px 0;}
        .ep-row{display:flex;justify-content:flex-end;gap:10px;}
        .ep-card button{padding:7px 14px;border:1px solid #aaa;border-radius:8px;background:#fff;cursor:pointer;}
        .ep-card button:hover{background:#f0f0f0;}
      `;
      doc.head.appendChild(st);
    }
  }

  function cleanup(doc, $) {
    ["#ep-dialog-scheda", "#ep-dialog-scheda-viewer"].forEach((sel) => {
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

  // =========================================================
  // Policy attach
  // =========================================================
  function attachSchedaGuardPolicy(iframeEl) {
    try {
      const attach = w.ExtremePlug?.security?.iframeGuardPolicies?.scheda?.attachSchedaPolicy;
      if (typeof attach === "function") {
        attach(iframeEl, { schedaBaseUrl: SCHEDA_BASE_URL, debugPrefix: "[scheda]" });
      }
    } catch (_) {}
  }

  // =========================
  // Viewer
  // =========================
  function openSchedaViewer(pgName) {
    const doc = LAST_UI_DOC;
    const $ = LAST_UI_$;
    if (!doc || !$ || !doc.body) return;

    const id = (pgName || "").toString().trim();
    if (!id) return;

    // salva posizione attuale se esiste già un viewer aperto
    rememberViewerPos(doc, $);

    cleanup(doc, $);

    const url = SCHEDA_BASE_URL + encodeURIComponent(id);
    debugLog("[scheda] openSchedaViewer", { id, url });

    $(doc.body).append(`
      <div id="ep-dialog-scheda-viewer">
        <iframe class="ep-scheda-iframe"
          src="${url}"
          loading="eager"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"></iframe>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda-viewer");
    const pos = LAST_VIEWER_POS || getDefaultViewerPos(doc);

    $dlg.dialog({
      title: "Scheda " + id,
      width: VIEWER_W,
      height: VIEWER_H,
      resizable: false,
      draggable: true,
      modal: false,
      dialogClass: "ep-scheda-viewer-ui",
      appendTo: $(doc.body),

      // ✅ non più center: default alto-destra, oppure ultima posizione
      position: {
        my: "left top",
        at: "left+" + pos.left + " top+" + pos.top,
        of: doc.defaultView,
      },

      open: function () {
        const jqui = getJqui();
        if (jqui) jqui.addTitleControls(doc, $, $dlg, "scheda_viewer");

        const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
        try { attachSchedaGuardPolicy(iframeEl); } catch (_) {}
      },

      close: function () {
        // salva posizione prima di chiudere
        rememberViewerPos(doc, $);

        // best-effort: stop guard timer se presente
        try {
          const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
          iframeEl?.__epIframeGuardStop?.();
        } catch (_) {}

        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
      },
    });
  }

  // =========================
  // Main dialog Sì/No
  // =========================
  function showMainDialog(doc, $) {
    cleanup(doc, $);

    $(doc.body).append(`
      <div id="ep-dialog-scheda">
        <div class="ep-card">
          <div class="ep-title">Vuoi vedere la tua scheda?</div>
          <div class="ep-row">
            <button type="button" id="ep-scheda-yes">Sì</button>
            <button type="button" id="ep-scheda-no">No</button>
          </div>
        </div>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda");

    $dlg.dialog({
      title: "Vedi Scheda?",
      width: 420,
      height: "auto",
      minHeight: 0,
      resizable: false,
      draggable: true,
      modal: false,
      closeOnEscape: false,
      dialogClass: "ep-scheda-basic-ui",
      appendTo: $(doc.body),
      close: function () {
        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
      },
    });

    $(doc)
      .find("#ep-scheda-yes")
      .off("click.scheda")
      .on("click.scheda", function () {
        debugLog("[scheda] CLICK: Si");
        try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }

        // ✅ call diretta: dipendenza obbligatoria
        w.ExtremePlug.pg.waitName(12, 120, (name) => {
          let finalName = name;
          if (!finalName) {
            try {
              finalName = (doc.defaultView || w.window).prompt("Inserisci il nome del personaggio:");
              finalName = (finalName || "").toString().trim() || null;
            } catch (_) {
              finalName = null;
            }
          }
          if (finalName) openSchedaViewer(finalName);
        });
      });

    $(doc)
      .find("#ep-scheda-no")
      .off("click.scheda")
      .on("click.scheda", function () {
        debugLog("[scheda] CLICK: No");
        try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }

        let other = null;
        try {
          other = (doc.defaultView || w.window).prompt("Inserisci il nome del personaggio:");
          other = (other || "").toString().trim() || null;
        } catch (_) {
          other = null;
        }

        if (other) openSchedaViewer(other);
      });
  }

  // =========================
  // API pubblica
  // =========================
  w.vedischeda = function () {
    debugLog("[scheda] vedischeda invoked");
    appendToUiWhenReady((doc) => {
      const $ = get$ForDoc(doc);

      LAST_UI_DOC = doc;
      LAST_UI_$ = $;

      if (!doc?.body || !$) {
        debugLog("[scheda] abort missing doc/$", { url: doc?.URL, has$: !!$ });
        return;
      }
      if (!($.fn && typeof $.fn.dialog === "function")) {
        debugLog("[scheda] abort: jQuery UI dialog missing");
        return;
      }

      ensureStyles(doc);

      // toggle/restore centralizzato in overlay.js
      const jqui = getJqui();
      const $viewer = $(doc).find("#ep-dialog-scheda-viewer");
      if (jqui && $viewer.length) {
        if (jqui.toggleOrRestore($viewer, "scheda_viewer")) return;
      }

      showMainDialog(doc, $);
    });
  };

  try {
    if (w.top && w.top !== w) w.top.vedischeda = w.vedischeda;
  } catch (_) {}
})(window);
