// core/constants.js
(function (w) {
  const origin = (w.location && w.location.origin) ? w.location.origin : 'https://www.extremelot.eu';

  w.ExtremePlug = w.ExtremePlug || {};

  w.ExtremePlug.constants = {
    ORIGIN: origin,
    LOTNEW_BASE: origin + '/lotnew/',
    PROC_BASE: origin + '/proc/',
  };
})(window);
