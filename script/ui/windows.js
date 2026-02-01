// features/windows.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const C = w.ExtremePlug.constants;
  const dialogs = w.ExtremePlug.dialogs;

  function apriMappaTestuale() {
    dialogs.openIframeDialog({
      id: 'mappaDiv',
      title: 'Mappa',
      url: 'https://ordinedelleguide.altervista.org/mappa/index.php',
      height: 700,
      width: 1000,
      minHeight: 400,
      minWidth: 600
    });
  }

  function apriGestionale() {
    dialogs.openIframeDialog({
      id: 'gestionale',
      title: 'Gestionale',
      url: C.PROC_BASE + 'gestionale/dashboardGE.asp',
      position: { my: 'center top', at: 'center top', of: w.window },
      height: 700,
      width: 1000
    });
  }

  function apriBanca() {
    dialogs.openIframeDialog({
      id: 'dlg-Banca',
      title: 'Banca di Lot',
      url: C.LOTNEW_BASE + 'banca_d.asp',
      height: 550,
      width: 950
    });
  }

  function apriSimboli() {
    dialogs.openIframeDialog({
      id: 'dlg-Simboli',
      title: 'Simboli e Statuti',
      url: C.LOTNEW_BASE + 'simboli.asp',
      height: 550,
      width: 950
    });
  }

  function apriLotInforma() {
    const id = 'dlg-LotInforma';
    const $dlg = w.jQuery('#' + id);
    if ($dlg.length && $dlg.dialog('isOpen')) {
      $dlg.dialog('close');
      return;
    }
    dialogs.openIframeDialog({
      id: id,
      title: 'Lot Informa',
      url: C.PROC_BASE + 'forum/forum.asp?codforum=14',
      height: 550,
      width: 1050
    });
  }

  // Compatibilità nomi storici
  w.apriGestionale = apriGestionale;
  w.apriBanca = apriBanca;
  w.apriSimboli = apriSimboli;
  w.apriLotInforma = apriLotInforma;

  w.ExtremePlug.windows = {
    apriMappaTestuale,
    apriGestionale,
    apriBanca,
    apriSimboli,
    apriLotInforma
  };
})(window);
