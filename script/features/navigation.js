// features/navigation.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const C = w.ExtremePlug.constants;

  function aziona(id) {
    try { w.top.frames['result'].location = '../proc/azioni.asp?azione=' + encodeURIComponent(id); } catch (_) {}
  }

  function spostati(dove) {
    try {
      // usa sempre stessa origin della home per evitare same-origin issues
      w.top.frames['mappa'].location = C.LOTNEW_BASE + String(dove).replace(/^\//,'');
    } catch (_) {}
  }

  w.aziona = aziona;
  w.spostati = spostati;
  w.ExtremePlug.navigation = { aziona, spostati };
})(window);
