// features/posta.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const C = w.ExtremePlug.constants;

  function scriviposta(nome) {
    const qs = nome ? ('?ID=' + encodeURIComponent(nome)) : '';
    const link = C.PROC_BASE + 'posta/_scrivialtri.asp' + qs;
    const url = C.proxyUrl(link);

    // id storico: dlg-postalot
    w.finestra('postalot', 'Piccione', url, 'width=15%,height=250');

    // toggle comportamento (compatibilità)
    w.jQuery(function () {
      try {
        w.jQuery('#dlg-postalot').dialog({ autoOpen: false });
        w.jQuery('#scriviposta').off('click.posta').on('click.posta', function () {
          const $d = w.jQuery('#dlg-postalot');
          if (!$d.dialog('isOpen')) $d.dialog('open');
          else $d.dialog('close');
        });
      } catch (_) {}
    });
  }

  function leggiposta() {
    const link = C.PROC_BASE + 'posta/leggilaposta.asp';
    const url = C.proxyUrl(link);
    w.finestra('postaLot', 'Posta', url, 'width=900,height=550');

    w.jQuery(function () {
      try {
        w.jQuery('#dlg-postaLot').dialog({ autoOpen: false });
        w.jQuery('#leggiposta').off('click.leggiposta').on('click.leggiposta', function () {
          const $d = w.jQuery('#dlg-postaLot');
          if (!$d.dialog('isOpen')) $d.dialog('open');
          else $d.dialog('close');
        });
      } catch (_) {}
    });
  }

  // Compatibilità
  w.scriviposta = scriviposta;
  w.leggiposta = leggiposta;

  w.ExtremePlug.posta = { scriviposta, leggiposta };
})(window);
