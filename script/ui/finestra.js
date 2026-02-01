// ui/finestra.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  function parseWindowParams(paramStr) {
    const out = {};
    if (!paramStr) return out;
    String(paramStr).split(',').forEach(function (part) {
      const kv = part.split('=');
      if (kv.length !== 2) return;
      const k = kv[0].trim();
      let v = kv[1].trim();
      // supporta percentuali
      if (v.endsWith('%')) {
        out[k] = v;
        return;
      }
      const n = parseInt(v, 10);
      if (!isNaN(n)) out[k] = n;
    });
    return out;
  }

  function finestra(id, titolo, pagina, dati) {
    const params = parseWindowParams(dati);
    const dlgId = 'dlg-' + id;

    w.jQuery('#' + dlgId).remove();

    const $dlg = w.jQuery('<div>', { id: dlgId }).appendTo('body');
    const $if = w.jQuery('<iframe>', {
      src: pagina,
      width: '100%',
      height: '100%',
      frameborder: 0
    });
    $dlg.append($if);

    // width/height in percent: convert in px based on window
    let width = params.width;
    let height = params.height;
    if (typeof width === 'string' && width.endsWith('%')) {
      width = Math.round(w.window.innerWidth * (parseInt(width, 10) / 100));
    }
    if (typeof height === 'string' && height.endsWith('%')) {
      height = Math.round(w.window.innerHeight * (parseInt(height, 10) / 100));
    }

    const dialogOpts = {
      title: titolo || '',
      resizable: true,
      draggable: true,
      position: { my: 'center', at: 'center', of: w.window },
      minHeight: 100,
      minWidth: 200,
      height: height || 550,
      width: width || 950,
      cache: false,
      close: function () { w.jQuery(this).dialog('destroy').remove(); }
    };

    $dlg.dialog(dialogOpts);

    // Se dialogExtend è presente, manteniamo compatibilità
    try {
      if (w.jQuery.fn && w.jQuery.fn.dialogExtend) {
        $dlg.dialogExtend({ maximizable: true, minimizable: true });
      }
    } catch (_) {}

    return $dlg;
  }

  // compatibilità globale
  w.finestra = finestra;
  w.ExtremePlug.finestra = finestra;
})(window);
