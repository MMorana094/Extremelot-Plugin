// script/features/posta.ui.js
// Posta - UI preset condiviso (stile dialog + iframe fill + title controls)
// Dipendenze:
//  - script/ui/overlay.js (overlay.jqui)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.postaUi = w.ExtremePlug.features.postaUi || {};
  const postaUi = w.ExtremePlug.features.postaUi;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function getOverlayJqui() {
    return w.ExtremePlug?.ui?.overlay?.jqui ||
           w.top?.ExtremePlug?.ui?.overlay?.jqui ||
           null;
  }

  /**
   * ensure(doc, $, $dlg, key, opts)
   * Applica:
   *  - tema posta (dialog style)
   *  - iframe fill
   *  - classi wrapper
   *  - draggable handle titlebar
   *  - controlli titlebar (opacity/minimize/close)
   */
  postaUi.ensure = function ensure(doc, $, $dlg, key, opts) {
    const jqui = getOverlayJqui();
    if (!jqui) {
      debugLog("[POSTA][ui] overlay.jqui mancante: carica /script/ui/overlay.js prima dei features");
      return;
    }

    jqui.ensureDialogStyle(doc, {
      ns: "posta",
      dialogClass: "ep-posta-ui",
      bg: "#f8e9aa",
      border: "#6e0000",
      titleBg: "#6e0000",
    });

    jqui.ensureIframeFill(doc, {
      ns: "posta",
      iframeClass: "ep-posta-iframe",
      dialogClass: "ep-posta-ui",
      bg: "#f8e9aa",
    });

    try {
      const $wrap = $dlg.closest(".ui-dialog");
      $wrap.addClass("ep-jqui-overlay ep-posta-ui");
      try {
        $wrap.draggable("option", "handle", ".ui-dialog-titlebar");
      } catch (_) {}
    } catch (_) {}

    jqui.addTitleControls(
      doc,
      $,
      $dlg,
      key,
      opts || { minWidth: 460, dockPad: 12 }
    );
  };

  // Export su top
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.postaUi = postaUi;
    }
  } catch (e) {
    debugLog("[POSTA][ui] export top failed", e);
  }

  debugLog("[POSTA][ui] loaded");
})(window);
