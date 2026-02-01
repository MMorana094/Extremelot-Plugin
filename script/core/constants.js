// core/constants.js
(function (w) {
  const origin = (w.location && w.location.origin) ? w.location.origin : 'https://www.extremelot.eu';
  const EXTREMEPLUG_ORIGIN = 'https://extremeplug.altervista.org';

  w.ExtremePlug = w.ExtremePlug || {};

  function proxyUrl(link, options) {
    const params = new URLSearchParams();
    if (options && options.classe) params.set('classe', options.classe);
    params.set('link', link);
    return EXTREMEPLUG_ORIGIN + '/docs/plugin/altri.php?' + params.toString();
  }

  w.ExtremePlug.constants = {
    ORIGIN: origin,
    LOTNEW_BASE: origin + '/lotnew/',
    PROC_BASE: origin + '/proc/',
    EXTREMEPLUG_ORIGIN: EXTREMEPLUG_ORIGIN,
    proxyUrl: proxyUrl
  };
})(window);
