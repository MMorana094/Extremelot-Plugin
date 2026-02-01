// features/bacheca.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const C = w.ExtremePlug.constants;
  const dialogs = w.ExtremePlug.dialogs;

  function bacheca(id) {
    if (!id) id = 'b1';

    let url;
    let nomebacheca;

    if (id === 'b1') {
      url = C.PROC_BASE + 'forum/bacheca.asp';
      nomebacheca = 'Ducale';
    } else if (id === 'b2') {
      url = C.PROC_BASE + 'forum/forumel.asp?cod=120';
      nomebacheca = 'Fato';
    } else {
      nomebacheca = w.jQuery('#imieiforumx option:selected').text() || 'Bacheca';
      url = C.PROC_BASE + 'forum/forum.asp?codforum=' + encodeURIComponent(id);
    }

    const dlgId = 'dlg-VediBacheca_' + id;
    dialogs.openIframeDialog({
      id: dlgId,
      title: 'Bacheca ' + nomebacheca,
      url: url,
      height: 550,
      width: 1050
    });

    // toggle pulsante (mantiene comportamento precedente)
    w.jQuery(function () {
      w.jQuery('#scelto_forum').off('click.bacheca').on('click.bacheca', function () {
        const $dlg = w.jQuery('#' + dlgId);
        if ($dlg.length && $dlg.dialog('isOpen')) $dlg.dialog('close');
        else bacheca(id);
      });
    });
  }

  w.bacheca = bacheca;
  w.ExtremePlug.bacheca = { bacheca: bacheca };
})(window);
