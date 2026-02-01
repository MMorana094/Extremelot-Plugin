// core/debug.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  let DEBUG_MODE = false;

  function debugLog() {
    if (!DEBUG_MODE) return;
    try {
      const args = Array.prototype.slice.call(arguments);
      console.log.apply(console, ['[DEBUG]'].concat(args));
    } catch (_) {}
  }

  function initDebugMode() {
    try {
      if (w.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get('DEBUG_MODE', (data) => {
          DEBUG_MODE = Boolean(data && data.DEBUG_MODE);
          debugLog('DEBUG_MODE iniziale:', DEBUG_MODE);
        });

        chrome.storage.onChanged.addListener((changes) => {
          if (changes && changes.DEBUG_MODE) {
            DEBUG_MODE = Boolean(changes.DEBUG_MODE.newValue);
            debugLog('DEBUG_MODE aggiornato:', DEBUG_MODE);
          }
        });
      }
    } catch (e) {
      console.warn('DEBUG init error:', e);
    }
  }

  w.ExtremePlug.debug = {
    initDebugMode,
    debugLog,
    // Log diagnostica standard di bootstrap (utile su frameset/all_frames)
    bootCheck(tag, extra) {
      try {
        debugLog(tag || 'bootCheck', Object.assign({
          href: (w.location && w.location.href) || '',
          isTop: w.top === w,
          hasFrameset: !!w.document.querySelector('frameset'),
          hasResultFrame: !!w.document.querySelector("frame[name='result']"),
          readyState: w.document && w.document.readyState
        }, extra || {}));
      } catch (_) {}
    },
    get enabled() { return DEBUG_MODE; },
    set enabled(v) { DEBUG_MODE = Boolean(v); }
  };
})(window);
