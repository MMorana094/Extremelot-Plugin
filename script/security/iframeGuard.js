// script/security/iframeGuard.js
//   blocca navigazioni "fuori iframe" su tutte le sub-frames (frameset compresi)


(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.security = w.ExtremePlug.security || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function isHttp(u) {
    try {
      const x = new URL(u);
      return x.protocol === "http:" || x.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function toAbs(href, base) {
    try {
      return new URL(href, base).href;
    } catch (_) {
      return null;
    }
  }

  function hardStop(e) {
    try { e.preventDefault(); } catch (_) {}
    try { e.stopPropagation(); } catch (_) {}
    try { e.stopImmediatePropagation(); } catch (_) {}
  }

  /**
   * installRecursiveGuard(iframeEl, opts)
   *
   * opts:
   *  - baseUrl?: string (fallback base per risoluzione url)
   *  - blockList?: Array<string|RegExp|function(absUrl):boolean>
   *  - handlers?: {
   *      onBeforeNavigate?: (absUrl, ctx) => void
   *      onBlocked?: (absUrl, ctx) => void
   *    }
   *  - helpers?: {
   *      onclickResolver?: (jsString, baseUrl) => string|null|"BLOCK"
   *    }
   */
  function installRecursiveGuard(iframeEl, opts) {
    const O = opts || {};
    if (!iframeEl) return;
    if (iframeEl.__epRecursiveGuardInstalled) return;
    iframeEl.__epRecursiveGuardInstalled = true;

    const baseFallback = String(O.baseUrl || iframeEl.src || "");

    const blockList = Array.isArray(O.blockList) ? O.blockList : [];
    const onBeforeNavigate = typeof O.handlers?.onBeforeNavigate === "function" ? O.handlers.onBeforeNavigate : null;
    const onBlocked = typeof O.handlers?.onBlocked === "function" ? O.handlers.onBlocked : null;

    const isBlocked = (abs) => {
      try {
        const url = String(abs || "");
        for (let i = 0; i < blockList.length; i++) {
          const rule = blockList[i];
          if (!rule) continue;
          if (typeof rule === "string" && url.includes(rule)) return true;
          if (rule instanceof RegExp && rule.test(url)) return true;
          if (typeof rule === "function" && !!rule(url)) return true;
        }
      } catch (_) {}
      return false;
    };

    const defaultOnclickResolver = (js, baseUrl) => {
      try {
        const s = String(js || "");

        // top.location / parent.location / location.href
        let m = s.match(/(?:top|parent)?\.?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return toAbs(m[1], baseUrl);

        m = s.match(/location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return toAbs(m[1], baseUrl);

        // window.open('...')
        m = s.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/i);
        if (m && m[1]) return toAbs(m[1], baseUrl);
      } catch (_) {}
      return null;
    };

    const onclickResolver =
      typeof O.helpers?.onclickResolver === "function" ? O.helpers.onclickResolver : defaultOnclickResolver;

    function patchOneWindow(win) {
      let doc = null;
      try { doc = win.document; } catch (_) { return; }
      if (!doc) return;

      if (doc.__epIframeGuardPatched) return;
      doc.__epIframeGuardPatched = true;

      const baseUrl = String(doc.URL || baseFallback || "");

      debugLog("[iframeGuard] patch window", { url: baseUrl });

      // (1) base target self + rimuovi base esistenti
      try { doc.querySelectorAll("base").forEach((b) => b.remove()); } catch (_) {}
      try {
        if (doc.head && !doc.querySelector("base#ep-base-self")) {
          const base = doc.createElement("base");
          base.id = "ep-base-self";
          base.setAttribute("target", "_self");
          doc.head.insertBefore(base, doc.head.firstChild);
        }
      } catch (_) {}

      // (2) normalizza target
      const fixTargets = () => {
        try {
          doc.querySelectorAll("a,area").forEach((a) => {
            const t = (a.getAttribute("target") || "").toLowerCase();
            if (t === "_top" || t === "_parent" || t === "_blank") a.setAttribute("target", "_self");
          });
          doc.querySelectorAll("form").forEach((f) => {
            const t = (f.getAttribute("target") || "").toLowerCase();
            if (t === "_top" || t === "_parent" || t === "_blank") f.setAttribute("target", "_self");
          });
        } catch (_) {}
      };
      fixTargets();

      try {
        if (!doc.__epTargetObserver && doc.documentElement) {
          const mo = new MutationObserver(() => fixTargets());
          mo.observe(doc.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["target"],
          });
          doc.__epTargetObserver = mo;
        }
      } catch (_) {}

      // (3) patch window.open
      try {
        if (!win.__epOpenPatched) {
          const origOpen = win.open;
          win.open = function (u) {
            try {
              const abs = toAbs(u, baseUrl);
              debugLog("[iframeGuard] window.open intercepted", { u, abs, from: baseUrl });

              if (abs && isHttp(abs)) {
                if (isBlocked(abs)) {
                  onBlocked && onBlocked(abs, { from: baseUrl, kind: "window.open" });
                  return null;
                }
                onBeforeNavigate && onBeforeNavigate(abs, { from: baseUrl, kind: "window.open" });
                iframeEl.src = abs;
                return null;
              }
            } catch (_) {}

            try { return origOpen ? origOpen.apply(win, arguments) : null; } catch (_) { return null; }
          };
          win.__epOpenPatched = true;
        }
      } catch (e) {
        debugLog("[iframeGuard] patch open err", String(e?.message || e));
      }

      // (4) click/auxclick/mouseup in capture
      const clickHandler = function (e) {
        try {
          const el = e.target;

          // onclick (elemento o parent)
          let raw = "";
          try {
            raw =
              (el && el.getAttribute && el.getAttribute("onclick")) ||
              (el && el.closest && el.closest("[onclick]") && el.closest("[onclick]").getAttribute("onclick")) ||
              "";
          } catch (_) { raw = ""; }

          if (raw) {
            const extracted = onclickResolver(raw, baseUrl);
            if (extracted) {
              hardStop(e);

              if (extracted === "BLOCK") {
                onBlocked && onBlocked("BLOCK", { from: baseUrl, kind: "onclick" });
                return;
              }

              if (isBlocked(extracted)) {
                onBlocked && onBlocked(extracted, { from: baseUrl, kind: "onclick" });
                return;
              }

              onBeforeNavigate && onBeforeNavigate(extracted, { from: baseUrl, kind: "onclick" });
              iframeEl.src = extracted;
              return;
            }
          }

          const a = (el && typeof el.closest === "function") ? el.closest("a,area") : null;
          if (!a) return;

          const href = (a.getAttribute("href") || "").trim();
          if (!href || href.startsWith("#")) return;

          if (/^javascript:/i.test(href)) {
            const extracted2 = onclickResolver(href, baseUrl);
            if (extracted2) {
              hardStop(e);

              if (extracted2 === "BLOCK" || isBlocked(extracted2)) {
                onBlocked && onBlocked(extracted2, { from: baseUrl, kind: "javascript:" });
                return;
              }

              onBeforeNavigate && onBeforeNavigate(extracted2, { from: baseUrl, kind: "javascript:" });
              iframeEl.src = extracted2;
            }
            return;
          }

          const abs = toAbs(href, baseUrl);
          if (!abs || !isHttp(abs)) return;

          hardStop(e);

          if (isBlocked(abs)) {
            onBlocked && onBlocked(abs, { from: baseUrl, kind: "link" });
            return;
          }

          onBeforeNavigate && onBeforeNavigate(abs, { from: baseUrl, kind: "link" });
          iframeEl.src = abs;
        } catch (_) {}
      };

      try {
        doc.addEventListener("click", clickHandler, true);
        doc.addEventListener("auxclick", clickHandler, true);
        doc.addEventListener("mouseup", clickHandler, true);
      } catch (_) {}

      // (5) submit guard
      try {
        doc.addEventListener(
          "submit",
          function (e) {
            try {
              const form = e.target;
              if (!form || form.tagName !== "FORM") return;

              const action = (form.getAttribute("action") || "").trim();
              const abs = toAbs(action || baseUrl, baseUrl);

              if (abs && isBlocked(abs)) {
                hardStop(e);
                onBlocked && onBlocked(abs, { from: baseUrl, kind: "submit" });
                return;
              }

              try { form.setAttribute("target", "_self"); } catch (_) {}
            } catch (_) {}
          },
          true
        );
      } catch (_) {}
    }

    function patchAllFrames() {
      let rootWin = null;
      try { rootWin = iframeEl.contentWindow; } catch (_) { rootWin = null; }
      if (!rootWin) return;

      const seen = new Set();
      const walk = (win) => {
        if (!win || seen.has(win)) return;
        seen.add(win);

        try { patchOneWindow(win); } catch (_) {}

        try {
          for (let i = 0; i < win.frames.length; i++) {
            walk(win.frames[i]);
          }
        } catch (_) {}
      };

      walk(rootWin);
    }

    // patch su ogni load + ripassi
    const onLoad = function () {
      debugLog("[iframeGuard] iframe load", { src: iframeEl.src });
      try { patchAllFrames(); } catch (_) {}
      setTimeout(() => { try { patchAllFrames(); } catch (_) {} }, 150);
      setTimeout(() => { try { patchAllFrames(); } catch (_) {} }, 400);
    };

    try { iframeEl.addEventListener("load", onLoad); } catch (_) {}

    const repatchTimer = setInterval(() => {
      try {
        if (!iframeEl.isConnected) {
          clearInterval(repatchTimer);
          return;
        }
        patchAllFrames();
      } catch (_) {}
    }, 700);

    // export small cleanup (best-effort)
    iframeEl.__epIframeGuardStop = function () {
      try { clearInterval(repatchTimer); } catch (_) {}
      try { iframeEl.removeEventListener("load", onLoad); } catch (_) {}
    };

    debugLog("[iframeGuard] installed");
  }

  w.ExtremePlug.security.iframeGuard = w.ExtremePlug.security.iframeGuard || {};
  w.ExtremePlug.security.iframeGuard.installRecursiveGuard = installRecursiveGuard;

  debugLog("[iframeGuard] loaded");
})(window);
