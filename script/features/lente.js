// script/features/lente.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  // API feature: non dipende da constants/proxy, URL hard-coded come richiesto
  w.ExtremePlug.lente = w.ExtremePlug.lente || {};
  w.ExtremePlug.lente.open = function () {
    w.finestra?.(
      "descLuogo",
      "Descrizione del luogo",
      "https://www.extremelot.eu/proc/vedi_desc_21.asp",
      "width=950,height=550"
    );
  };
})(window);
