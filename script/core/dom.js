// core/dom.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const { debugLog } = w.ExtremePlug.debug || { debugLog: function(){} };

  function safeGetFrame(name) {
    try {
      const f = w.top && w.top.frames && w.top.frames[name] ? w.top.frames[name] : null;
      return f || null;
    } catch (_) {
      return null;
    }
  }

  function waitForFrameBody(frameName, cb, intervalMs, timeoutMs) {
    intervalMs = intervalMs || 100;
    timeoutMs = timeoutMs || 10000;
    const start = Date.now();

    const t = setInterval(() => {
      try {
        const frame = safeGetFrame(frameName);
        if (frame && frame.document && frame.document.body) {
          clearInterval(t);
          cb(frame.document.body, frame);
          return;
        }
      } catch (_) {
        // cross-origin o non pronto
      }

      if (Date.now() - start > timeoutMs) {
        clearInterval(t);
        debugLog('waitForFrameBody timeout:', frameName);
      }
    }, intervalMs);
  }

  function appendToFrameBody(frameName, $el) {
    waitForFrameBody(frameName, (body) => {
      try { w.jQuery(body).append($el); } catch (_) {}
    });
  }

  w.ExtremePlug.dom = {
    safeGetFrame,
    waitForFrameBody,
    appendToFrameBody
  };
})(window);
