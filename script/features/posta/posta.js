// script/features/posta.js
// Posta - Viewer (lettura) + routing
// Dipendenze:
//  - script/ui/overlay.js
//  - script/ui/getUiDoc.js (ExtremePlug.ui.getUiDoc / get$ForDoc)
//  - script/features/posta.ui.js   ✅ (preset UI condiviso)
//  - script/features/compose.js
//  - script/features/posta.viewer.js
//  - script/features/posta.urls.js

(function (w) {
  // =========================================================
  // HARD INIT
  // =========================================================
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.posta = w.ExtremePlug.features.posta || {};
  const postaAPI = w.ExtremePlug.features.posta;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // =========================================================
  // Dipendenze: compose.js + posta.viewer.js + posta.urls.js + ui/getUiDoc.js
  // =========================================================
  function getComposeAPI() {
    return w.ExtremePlug?.features?.postaCompose || w.top?.ExtremePlug?.features?.postaCompose || null;
  }

  function getViewerAPI() {
    return w.ExtremePlug?.features?.postaViewer || w.top?.ExtremePlug?.features?.postaViewer || null;
  }

  function getUrlsAPI() {
    return w.ExtremePlug?.features?.postaUrls || w.top?.ExtremePlug?.features?.postaUrls || null;
  }

  function getUiHostAPI() {
    return w.ExtremePlug?.ui || w.top?.ExtremePlug?.ui || null;
  }

  function getPostaUiAPI() {
    return w.ExtremePlug?.features?.postaUi || w.top?.ExtremePlug?.features?.postaUi || null;
  }

  // =========================================================
  // Cleanup
  // =========================================================
  const VIEWER_ID = "ep-dialog-posta-viewer";
  const VIEW_IFR_ID = "ep-posta-view-iframe";
  const VIEW_W = 900;
  const VIEW_H = 550;
  const REQUIRED_FRAME_NAME = "bdx";

  function cleanup(doc, $) {
    try {
      const $el = $(doc).find("#" + VIEWER_ID);
      if ($el.length && typeof $el.dialog === "function") {
        try { $el.dialog("destroy"); } catch (_) {}
      }
      $el.remove();
    } catch (_) {
      try { doc.getElementById(VIEWER_ID)?.remove(); } catch (_) {}
    }
  }

  // =========================================================
  // Composer bridge
  // =========================================================
  function openComposeFromHere(doc, url) {
    const compose = getComposeAPI();
    if (!compose?.open) {
      console.warn("[POSTA] compose.js non caricato: impossibile aprire composer");
      return;
    }
    try { compose.ensureBxsFrame && compose.ensureBxsFrame(doc); } catch (_) {}
    compose.open(doc, url);
  }

  // =========================================================
  // Viewer dialog (UI) — engine esterno in posta.viewer.js
  // =========================================================
  function openViewer(doc, $, startUrl) {
    if (!doc?.body) return;

    const hasDialog = !!($ && $.fn && typeof $.fn.dialog === "function");
    if (!hasDialog) {
      debugLog("[POSTA] abort: jQuery UI dialog missing nel doc UI");
      return;
    }

    cleanup(doc, $);

    $(doc.body).append(
      `<div id="${VIEWER_ID}">
         <iframe id="${VIEW_IFR_ID}" class="ep-posta-iframe" name="${REQUIRED_FRAME_NAME}"
           src="about:blank"
           style="width:100%;height:100%;border:0;display:block"></iframe>
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
        // UI preset condiviso
        const postaUi = getPostaUiAPI();
        if (!postaUi?.ensure) {
          console.warn("[POSTA] posta.ui.js mancante: impossibile applicare UI preset");
        } else {
          postaUi.ensure(doc, $, $dlg, "posta_viewer", { minWidth: 460, dockPad: 12 });
        }

        const viewer = getViewerAPI();
        if (!viewer?.mount) {
          console.warn("[POSTA] posta.viewer.js non caricato: impossibile caricare contenuti viewer");
          return;
        }

        try { viewer.reset && viewer.reset(doc, VIEW_IFR_ID); } catch (_) {}

        viewer.mount({
          doc,
          iframeId: VIEW_IFR_ID,
          startUrl: startUrl,
          onCompose: (u) => openComposeFromHere(doc, u),
        });
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
    const ui = getUiHostAPI();
    const urls = getUrlsAPI();

    const doc = ui?.getUiDoc ? ui.getUiDoc() : null;
    const $ = ui?.get$ForDoc ? ui.get$ForDoc(doc) : null;

    const startUrl = urls?.START_URL || "https://www.extremelot.eu/proc/posta/leggilaposta.asp";

    if (!doc?.body) {
      console.warn("[POSTA] open: UI doc non trovato (getUiDoc mancante o frameset non pronto)");
      return;
    }
    openViewer(doc, $, startUrl);
  };

  postaAPI.scrivi = async function () {
    const ui = getUiHostAPI();
    const urls = getUrlsAPI();

    const doc = ui?.getUiDoc ? ui.getUiDoc() : null;
    if (!doc?.body) {
      console.warn("[POSTA] scrivi: UI doc non trovato (getUiDoc mancante o frameset non pronto)");
      return;
    }

    const u = urls?.buildScriviUrlWithNomepg
      ? await urls.buildScriviUrlWithNomepg()
      : "https://www.extremelot.eu/proc/posta/scrivialtri.asp";

    openComposeFromHere(doc, u);
  };

  // Export anche su top
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.posta = postaAPI;
    }
  } catch (_) {}

  debugLog("[POSTA] loaded");
})(window);
