// script/features/compose.js
// Posta - Composer (scrivi/rispondi) separato da posta.js

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.postaCompose = w.ExtremePlug.features.postaCompose || {};
  const composeAPI = w.ExtremePlug.features.postaCompose;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // IDs (devono combaciare col viewer)
  const COMPOSE_ID = "ep-dialog-posta-compose";
  const COMP_IFR_ID = "ep-posta-compose-iframe";

  // Size
  const COMP_W = 950;
  const COMP_H = 650;

  // Frame name richiesto da LOT
  const REQUIRED_FRAME_NAME = "bdx";

  function get$ForDoc(doc) {
    try {
      return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  function getOverlayJqui() {
    return w.ExtremePlug?.ui?.overlay?.jqui || w.top?.ExtremePlug?.ui?.overlay?.jqui || null;
  }

  function ensurePostaOverlayUi(doc, $, $dlg, key, opts) {
    const jqui = getOverlayJqui();
    if (!jqui) {
      debugLog("[POSTA][compose] overlay.jqui mancante: carica /script/ui/overlay.js prima dei features");
      return;
    }

    jqui.ensureDialogStyle(doc, {
      ns: "posta",
      dialogClass: "ep-posta-ui",
      bg: "#f8e9aa",
      border: "#6e0000",
      titleBg: "#6e0000",
    });

    // ✅ iframe fill centralizzato
    jqui.ensureIframeFill(doc, {
      ns: "posta",
      iframeClass: "ep-posta-iframe",
      dialogClass: "ep-posta-ui",
      bg: "#f8e9aa",
    });

    try {
      const $wrap = $dlg.closest(".ui-dialog");
      $wrap.addClass("ep-jqui-overlay ep-posta-ui");
      try { $wrap.draggable("option", "handle", ".ui-dialog-titlebar"); } catch (_) {}
    } catch (_) {}

    jqui.addTitleControls(doc, $, $dlg, key, opts || { minWidth: 460, dockPad: 12 });
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

      debugLog("[POSTA][compose] bsx frame stub creato");
    } catch (e) {
      console.warn("[POSTA][compose] ensureBxsFrame failed", e);
    }
  }

  // =========================================================
  // Composer dialog
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

    let $dlg = $(doc).find("#" + COMPOSE_ID);
    if (!$dlg.length) {
      $(doc.body).append(
        `<div id="${COMPOSE_ID}">
           <iframe id="${COMP_IFR_ID}" class="ep-posta-iframe" name="${REQUIRED_FRAME_NAME}"
             src="about:blank"
             style="width:100%;height:100%;border:0;display:block"></iframe>
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
          ensurePostaOverlayUi(doc, $, $dlg, "posta_compose", {
            minWidth: 460,
            dockPad: 12,
            onClose: () => {
              try {
                const ifr = doc.getElementById(COMP_IFR_ID);
                if (ifr) ifr.src = "about:blank";
              } catch (_) {}
            },
          });
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
    debugLog("[POSTA][compose] opened", { url });
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
    debugLog("[POSTA][compose] fallback opened", { url });
  }

  // API
  composeAPI.open = openCompose;
  composeAPI.ensureBxsFrame = ensureBxsFrame;

  // Export su top
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.postaCompose = composeAPI;
    }
  } catch (_) {}

  debugLog("[POSTA][compose] loaded");
})(window);
