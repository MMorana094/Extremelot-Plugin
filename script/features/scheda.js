// script/features/scheda.js
// Option B (safe): allow-top-navigation-by-user-activation + allow-popups
// ma: NIENTE finestre nuove -> reindirizziamo TUTTO nell'iframe
// - patch ricorsiva su tutte le sub-frames della scheda
// - stopImmediatePropagation per bloccare onclick che fa window.open/top.location
// - posta sempre bloccata

(function (w) {
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};
  debugLog("[scheda] loaded (Option B - recursive guard)");

  let LAST_UI_DOC = null;
  let LAST_UI_$ = null;

  const SCHEDA_BASE_URL = "https://www.extremelot.eu/proc/schedaPG/scheda.asp?ID=";
  const VIEWER_W = 1000;
  const VIEWER_H = 600;

  // =========================================================
  // getUiDoc() – FRAME-SAFE + VISIBILITY-AWARE
  // =========================================================
  function getUiDoc() {
    function isFramesetDoc(doc) {
      try {
        const b = doc?.body;
        if (!b) return true;
        const tag = (b.tagName || "").toUpperCase();
        if (tag === "FRAMESET") return true;
        if (doc.querySelector("frameset")) return true;
        return false;
      } catch (_) {
        return true;
      }
    }
    function getVisibleArea(win) {
      try {
        const fe = win.frameElement;
        if (!fe) return Math.max(0, win.innerWidth || 0) * Math.max(0, win.innerHeight || 0);
        const cs = win.getComputedStyle(fe);
        if (cs.display === "none" || cs.visibility === "hidden") return 0;
        const r = fe.getBoundingClientRect();
        return Math.max(0, r.width) * Math.max(0, r.height);
      } catch (_) {
        return 0;
      }
    }

    try {
      if (LAST_UI_DOC?.body && !isFramesetDoc(LAST_UI_DOC)) {
        const area = getVisibleArea(LAST_UI_DOC.defaultView);
        if (area > 200 * 200) return LAST_UI_DOC;
      }
    } catch (_) {}

    try {
      const best = { doc: null, score: 0, url: "" };
      const visit = (win) => {
        let doc = null;
        try { doc = win.document; } catch (_) { doc = null; }

        if (doc?.body && !isFramesetDoc(doc)) {
          const area = getVisibleArea(win);
          const url = doc.URL || "";
          const boost = (url.includes("/proc/") ? 1.25 : 1.0) * (url.includes("/lotnew/") ? 1.10 : 1.0);
          const score = area * boost;
          if (score > best.score) { best.doc = doc; best.score = score; best.url = url; }
        }

        try { for (let i = 0; i < win.frames.length; i++) visit(win.frames[i]); } catch (_) {}
      };
      visit(w.top);
      if (best.doc?.body) return best.doc;
    } catch (_) {}

    try { if (w.document?.body) return w.document; } catch (_) {}
    return null;
  }

  function appendToUiWhenReady(fn) {
    const t = setInterval(() => {
      try {
        const doc = getUiDoc();
        if (doc?.body) {
          clearInterval(t);
          debugLog("[scheda] UI doc ready", { url: doc.URL, readyState: doc.readyState });
          fn(doc);
        }
      } catch (_) {}
    }, 100);
  }

  function get$ForDoc(doc) {
    try { return doc?.defaultView?.jQuery || w.top?.jQuery || w.jQuery || null; }
    catch (_) { return w.top?.jQuery || w.jQuery || null; }
  }

  // =========================================================
  // CSS
  // =========================================================
  function ensureSchedaStyle(doc) {
    if (!doc?.head || doc.getElementById("extremeplug-scheda-style")) return;

    const st = doc.createElement("style");
    st.id = "extremeplug-scheda-style";
    st.textContent = `
      .ep-card{
        background:#f6f6f6;color:#222;border:1px solid #cfcfcf;border-radius:12px;
        padding:14px;box-shadow:0 6px 20px rgba(0,0,0,.18);font-family:Arial,sans-serif;font-size:14px;
      }
      .ep-title{font-size:14px;margin:0 0 10px 0;}
      .ep-row{display:flex;justify-content:flex-end;gap:10px;margin-top:14px;}
      .ep-card button{padding:7px 14px;border:1px solid #aaa;border-radius:8px;background:#fff;cursor:pointer;}
      .ep-card button:hover{background:#f0f0f0;}

      .ui-dialog.ep-scheda-ui{z-index:9999999 !important;}
      .ui-widget-overlay{z-index:9999998 !important;}

      .ui-dialog.ep-scheda-viewer-ui{
        background:#f8e9aa !important;border:3px solid #6e0000 !important;border-radius:6px !important;
        overflow:hidden !important;
        box-shadow:0 10px 28px rgba(0,0,0,.35),
          inset 0 0 0 1px rgba(0,0,0,.65),
          inset 0 0 0 3px rgba(244,227,150,.55) !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar{
        background:#6e0000 !important;border:0 !important;border-bottom:1px solid rgba(0,0,0,.55) !important;
        border-radius:0 !important;padding:4px 10px !important;min-height:22px !important;position:relative !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-title{
        color:#fff !important;font-weight:700 !important;font-size:13px !important;line-height:18px !important;
        text-shadow:0 1px 0 rgba(0,0,0,.45) !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-content{
        padding:0 !important;margin:0 !important;overflow:hidden !important;background:#000 !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-buttonpane{display:none !important;}
      .ui-dialog.ep-scheda-viewer-ui .ui-resizable-handle{display:none !important;}

      .ep-scheda-iframe{width:100%;border:0;display:block;background:#000;}

      .ui-dialog.ep-scheda-viewer-ui .ep-title-controls{
        position:absolute;right:8px;top:50%;transform:translateY(-50%);
        display:flex;align-items:center;gap:10px;z-index:2;
      }
      .ui-dialog.ep-scheda-viewer-ui .ep-titlebtn{
        width:26px;height:18px;border-radius:3px;display:flex;align-items:center;justify-content:center;
        cursor:pointer;user-select:none;color:#fff;font-weight:700;line-height:1;opacity:.95;
      }
      .ui-dialog.ep-scheda-viewer-ui .ep-titlebtn:hover{background:rgba(255,255,255,.10);}
      .ui-dialog.ep-scheda-viewer-ui .ep-opacity-wrap{
        display:flex;align-items:center;gap:6px;color:#fff;font-size:12px;opacity:.95;white-space:nowrap;
      }
      .ui-dialog.ep-scheda-viewer-ui input.ep-opacity{width:120px;height:12px;cursor:pointer;}

      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-button-text,
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-dialog-titlebar-close-text{display:none !important;}
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close{
        position:static !important;width:26px !important;height:18px !important;border:0 !important;border-radius:3px !important;
        background:transparent !important;box-shadow:none !important;margin:0 !important;padding:0 !important;
      }
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close:hover{background:rgba(255,255,255,.10) !important;}
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close .ui-icon{display:none !important;}
      .ui-dialog.ep-scheda-viewer-ui .ui-dialog-titlebar-close::before{
        content:"✕";color:#fff;font-weight:800;font-size:14px;line-height:18px;display:block;text-align:center;width:26px;height:18px;
      }

      .ui-dialog.ep-noclose .ui-dialog-titlebar-close{display:none !important;}
    `;
    doc.head.appendChild(st);
    debugLog("[scheda] style injected");
  }

  function cleanup(doc, $) {
    debugLog("[scheda] cleanup start");
    ["#ep-dialog-scheda", "#ep-dialog-scheda-viewer"].forEach((sel) => {
      try {
        const $el = $(doc).find(sel);
        if ($el.length && typeof $el.dialog === "function") {
          try { $el.dialog("destroy"); } catch (_) {}
        }
        $el.remove();
      } catch (_) {
        try { doc.querySelector(sel)?.remove(); } catch (_) {}
      }
    });
    debugLog("[scheda] cleanup end");
  }

  // =========================
  // PG name
  // =========================
  function getOwnPgName() {
    const n1 = w.ExtremePlug?.pg?.getName?.();
    if (n1) return n1;

    try {
      const fw = w.top?.frames?.logo;
      const el = fw?.document?.querySelector("input[name='player']");
      const v = el?.value;
      return (v && String(v).trim()) ? String(v).trim() : null;
    } catch (_) {
      return null;
    }
  }

  function waitOwnPgName(maxAttempts, delayMs, cb) {
    const name = getOwnPgName();
    debugLog("[scheda] PG name check", { attemptsLeft: maxAttempts, name });
    if (name) return cb(name);
    if (maxAttempts <= 0) return cb(null);
    setTimeout(() => waitOwnPgName(maxAttempts - 1, delayMs, cb), delayMs);
  }

  // =========================
  // Dialog base
  // =========================
  function openDialogBasic(doc, $, $dlg, title) {
    $dlg.dialog({
      title: title || "Vedi Scheda?",
      width: 420,
      height: "auto",
      resizable: false,
      draggable: true,
      modal: false,
      closeOnEscape: false,
      dialogClass: "ep-noclose",
      appendTo: $(doc.body),
      position: { my: "center", at: "center", of: doc.defaultView || w.window },
      open: function () { try { $dlg.closest(".ui-dialog").addClass("ep-scheda-ui"); } catch (_) {} },
      close: function () { try { $(this).dialog("destroy"); } catch (_) {} $(this).remove(); }
    });
  }

  // =========================
  // Title controls
  // =========================
  function addViewerTitleControls(doc, $, $dlg, $wrap, fixedH) {
    const $title = $wrap.find(".ui-dialog-titlebar");
    if (!$title.length) return;
    if ($title.find(".ep-title-controls").length) return;

    const $controls = $(doc.createElement("div")).addClass("ep-title-controls");

    const $opWrap = $(doc.createElement("div")).addClass("ep-opacity-wrap");
    const $opLabel = $(doc.createElement("span")).text("Opacity");
    const $op = $(doc.createElement("input")).addClass("ep-opacity")
      .attr({ type: "range", min: "20", max: "100", value: "100" });
    $opWrap.append($opLabel, $op);

    const $min = $(doc.createElement("div")).addClass("ep-titlebtn").attr("title", "Riduci a icona").text("—");

    $controls.append($opWrap, $min);
    $title.append($controls);

    $wrap.data("ep_minimized", false);
    $wrap.data("ep_saved_content_h", $dlg.height());
    $wrap.data("ep_fixed_h", Number(fixedH) || VIEWER_H);
    $wrap.data("ep_saved_pos", null);

    function savePos() {
      try {
        const left = parseInt($wrap.css("left"), 10);
        const top = parseInt($wrap.css("top"), 10);
        if (!isNaN(left) && !isNaN(top)) $wrap.data("ep_saved_pos", { left, top });
      } catch (_) {}
    }
    function moveBottomRight() {
      try {
        const win = doc?.defaultView || w.window;
        const vw = Math.max(320, win.innerWidth || 0);
        const vh = Math.max(240, win.innerHeight || 0);
        const ww = $wrap.outerWidth() || 240;
        const wh = $wrap.outerHeight() || 40;
        $wrap.css({
          position: "fixed",
          left: Math.max(6, Math.round(vw - ww - 10)) + "px",
          top: Math.max(6, Math.round(vh - wh - 10)) + "px"
        });
      } catch (_) {}
    }
    function restorePos() {
      try {
        const p = $wrap.data("ep_saved_pos");
        if (p && typeof p.left === "number" && typeof p.top === "number") {
          $wrap.css({ position: "fixed", left: p.left + "px", top: p.top + "px" });
        }
      } catch (_) {}
    }

    $op.on("input change", function (e) {
      try { e.stopPropagation(); } catch (_) {}
      const v = Number(this.value || 100);
      const op = Math.max(0.2, Math.min(1, v / 100));
      $wrap.css("opacity", op);
      debugLog("[scheda] opacity", op);
    });
    $op.on("mousedown pointerdown", function (e) { try { e.stopPropagation(); } catch (_) {} });

    $min.on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const minimized = !!$wrap.data("ep_minimized");
      const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 0;

      if (!minimized) {
        savePos();
        $wrap.data("ep_saved_content_h", $dlg.height());
        $dlg.hide();
        $wrap.height(titleH + 2);
        $wrap.data("ep_minimized", true);
        $min.attr("title", "Ripristina").text("▢");
        moveBottomRight();
        debugLog("[scheda] minimized");
      } else {
        const contentH = Number($wrap.data("ep_saved_content_h")) || 400;
        const fixedH2 = Number($wrap.data("ep_fixed_h")) || VIEWER_H;

        $dlg.show().height(contentH).css({ overflow: "hidden" });

        const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
        if (iframeEl) iframeEl.style.height = contentH + "px";

        $wrap.height(fixedH2);
        $wrap.data("ep_minimized", false);
        $min.attr("title", "Riduci a icona").text("—");
        restorePos();
        debugLog("[scheda] restored");
      }
    });

    try {
      const $close = $wrap.find(".ui-dialog-titlebar-close").first();
      if ($close.length) {
        $close.attr("title", "Chiudi");
        $controls.append($close);
      }
    } catch (_) {}
  }

  // =========================
  // Viewer dialog
  // =========================
  function openDialogViewer(doc, $, $dlg, title, onOpen) {
    $dlg.dialog({
      title: title || "Scheda PG",
      width: VIEWER_W,
      height: VIEWER_H,
      resizable: false,
      draggable: true,
      modal: false,
      appendTo: $(doc.body),
      position: { my: "center", at: "center", of: doc.defaultView || w.window },
      open: function () {
        const $wrap = $dlg.closest(".ui-dialog");
        $wrap.addClass("ep-scheda-ui ep-scheda-viewer-ui");

        const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 0;
        const contentH = Math.max(120, VIEWER_H - titleH - 2);

        $dlg.css({ padding: 0, overflow: "hidden" }).height(contentH);

        const iframeEl = $dlg.find("iframe.ep-scheda-iframe")[0];
        if (iframeEl) iframeEl.style.height = contentH + "px";

        addViewerTitleControls(doc, $, $dlg, $wrap, VIEWER_H);

        debugLog("[scheda] viewer open", { titleH, contentH, iframeSrc: iframeEl?.src });
        if (typeof onOpen === "function") onOpen({ iframeEl, contentH });
      },
      close: function () {
        try { $(this).dialog("destroy"); } catch (_) {}
        $(this).remove();
        debugLog("[scheda] viewer closed");
      }
    });
  }

  // =========================================================
  // IFRAME GUARD (RECURSIVE)
  // =========================================================
  function installRecursiveGuard(iframeEl) {
    if (!iframeEl || iframeEl.__epRecursiveGuardInstalled) return;
    iframeEl.__epRecursiveGuardInstalled = true;

    const isHttp = (u) => {
      try { const x = new URL(u); return x.protocol === "http:" || x.protocol === "https:"; }
      catch (_) { return false; }
    };

    const toAbs = (href, base) => {
      try { return new URL(href, base || iframeEl.src).href; } catch (_) { return null; }
    };

    const isPosta = (abs) => String(abs || "").includes("/proc/posta/");

    function extractUrlFromOnclick(js, baseUrl) {
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

        // dettagli('Nome') / posta('Nome')
        m = s.match(/(dettagli|posta)\s*\(\s*'([^']+)'\s*\)/i);
        if (m) {
          const fn = String(m[1] || "").toLowerCase();
          const name = String(m[2] || "").trim();
          if (fn === "posta") return "POSTA_BLOCK";
          if (fn === "dettagli") return SCHEDA_BASE_URL + encodeURIComponent(name);
        }
      } catch (_) {}
      return null;
    }

    function hardStop(e) {
      try { e.preventDefault(); } catch (_) {}
      try { e.stopPropagation(); } catch (_) {}
      try { e.stopImmediatePropagation(); } catch (_) {}
    }

    function patchOneWindow(win) {
      let doc = null;
      try { doc = win.document; } catch (_) { return; }
      if (!doc) return;

      if (doc.__epSchedaGuardPatched) return;
      doc.__epSchedaGuardPatched = true;

      const baseUrl = doc.URL || iframeEl.src;

      debugLog("[scheda][guard] patch window", { url: baseUrl });

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
            attributeFilter: ["target"]
          });
          doc.__epTargetObserver = mo;
        }
      } catch (_) {}

      // (3) patch window.open in QUESTO win
      try {
        if (!win.__epOpenPatched) {
          const origOpen = win.open;
          win.open = function (u) {
            try {
              const abs = toAbs(u, baseUrl);
              debugLog("[scheda][guard] window.open intercepted", { u, abs, from: baseUrl });
              if (abs && isHttp(abs)) {
                if (isPosta(abs)) {
                  debugLog("[scheda][guard] posta blocked (open)", { abs });
                  return null;
                }
                iframeEl.src = abs;
                return null;
              }
            } catch (_) {}
            try { return origOpen ? origOpen.apply(win, arguments) : null; } catch (_) { return null; }
          };
          win.__epOpenPatched = true;
        }
      } catch (e) {
        debugLog("[scheda][guard] patch open err", String(e?.message || e));
      }

      // (4) click/auxclick CAPTURE: intercetta href/onclick e redirige in iframe
      const clickHandler = function (e) {
        try {
          const el = e.target;

          // onclick (sull'elemento o su un parent)
          let raw = "";
          try {
            raw =
              (el && el.getAttribute && el.getAttribute("onclick")) ||
              (el && el.closest && el.closest("[onclick]") && el.closest("[onclick]").getAttribute("onclick")) ||
              "";
          } catch (_) { raw = ""; }

          if (raw) {
            const extracted = extractUrlFromOnclick(raw, baseUrl);
            if (extracted) {
              hardStop(e);

              if (extracted === "POSTA_BLOCK") {
                debugLog("[scheda][guard] posta blocked (onclick)", { from: baseUrl });
                return;
              }
              if (isPosta(extracted)) {
                debugLog("[scheda][guard] posta blocked (onclick url)", { extracted });
                return;
              }

              debugLog("[scheda][guard] onclick redirect -> iframe", { extracted, from: baseUrl });
              iframeEl.src = extracted;
              return;
            }
          }

          // link normali
          const a = (el && typeof el.closest === "function") ? el.closest("a,area") : null;
          if (!a) return;

          const href = (a.getAttribute("href") || "").trim();
          if (!href) return;
          if (href.startsWith("#")) return;

          if (/^javascript:/i.test(href)) {
            const extracted2 = extractUrlFromOnclick(href, baseUrl);
            if (extracted2) {
              hardStop(e);
              if (extracted2 === "POSTA_BLOCK" || isPosta(extracted2)) {
                debugLog("[scheda][guard] posta blocked (javascript:)", { from: baseUrl });
                return;
              }
              debugLog("[scheda][guard] javascript: redirect -> iframe", { extracted2, from: baseUrl });
              iframeEl.src = extracted2;
            }
            return;
          }

          const abs = toAbs(href, baseUrl);
          if (!abs || !isHttp(abs)) return;

          hardStop(e);

          if (isPosta(abs)) {
            debugLog("[scheda][guard] posta blocked (link)", { abs, from: baseUrl });
            return;
          }

          debugLog("[scheda][guard] link redirect -> iframe", { abs, from: baseUrl });
          iframeEl.src = abs;
        } catch (_) {}
      };

      try {
        doc.addEventListener("click", clickHandler, true);
        doc.addEventListener("auxclick", clickHandler, true);
        // extra: alcuni menu usano mouseup/mousedown
        doc.addEventListener("mouseup", clickHandler, true);
      } catch (_) {}

      // (5) submit guard
      try {
        doc.addEventListener("submit", function (e) {
          try {
            const form = e.target;
            if (!form || form.tagName !== "FORM") return;

            const action = (form.getAttribute("action") || "").trim();
            const abs = toAbs(action || baseUrl, baseUrl);

            if (abs && isPosta(abs)) {
              hardStop(e);
              debugLog("[scheda][guard] posta blocked (submit)", { abs, from: baseUrl });
              return;
            }

            try { form.setAttribute("target", "_self"); } catch (_) {}
          } catch (_) {}
        }, true);
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

        // ricorsione su subframes
        try {
          for (let i = 0; i < win.frames.length; i++) {
            walk(win.frames[i]);
          }
        } catch (_) {}
      };

      walk(rootWin);
    }

    // patch su ogni load + ripasso leggero (frameset spesso ricarica subframe)
    iframeEl.addEventListener("load", function () {
      debugLog("[scheda][guard] iframe load fired", { src: iframeEl.src });
      try { patchAllFrames(); } catch (_) {}
      setTimeout(() => { try { patchAllFrames(); } catch (_) {} }, 150);
      setTimeout(() => { try { patchAllFrames(); } catch (_) {} }, 400);
    });

    // safety: se la scheda genera frame dopo, li agganciamo lo stesso
    const repatchTimer = setInterval(() => {
      try {
        // se iframe non più nel DOM, stop
        if (!iframeEl.isConnected) { clearInterval(repatchTimer); return; }
        patchAllFrames();
      } catch (_) {}
    }, 700);

    debugLog("[scheda][guard] recursive guard installed");
  }

  // =========================
  // Open viewer
  // =========================
  function openSchedaViewer(pgName) {
    const doc = LAST_UI_DOC;
    const $ = LAST_UI_$;
    if (!doc || !$ || !doc.body) return;

    const id = (pgName || "").toString().trim();
    if (!id) return;

    const url = SCHEDA_BASE_URL + encodeURIComponent(id);
    debugLog("[scheda] openSchedaViewer", { id, url });

    cleanup(doc, $);

    // OPZIONE B sandbox:
    // - allow-top-navigation-by-user-activation: top-nav consentita solo da user gesture (ma noi la preveniamo e redirigiamo)
    // - allow-popups: evita "Blocked opening"; noi la neutralizziamo patchando window.open in TUTTI i frame interni
    $(doc.body).append(`
      <div id="ep-dialog-scheda-viewer">
        <iframe class="ep-scheda-iframe"
          src="${url}"
          loading="eager"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"></iframe>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda-viewer");

    openDialogViewer(doc, $, $dlg, `Scheda ${id}`, ({ iframeEl }) => {
      try {
        installRecursiveGuard(iframeEl);
        debugLog("[scheda] guard installed", { iframeSrc: iframeEl?.src });
      } catch (e) {
        debugLog("[scheda] guard install err", String(e?.message || e));
      }
    });
  }

  // =========================
  // Main dialog Sì/No
  // =========================
  function showMainDialog(doc, $) {
    cleanup(doc, $);

    $(doc.body).append(`
      <div id="ep-dialog-scheda">
        <div class="ep-card">
          <div class="ep-title">Vuoi vedere la tua scheda?</div>
          <div class="ep-row">
            <button type="button" id="ep-scheda-yes">Sì</button>
            <button type="button" id="ep-scheda-no">No</button>
          </div>
        </div>
      </div>
    `);

    const $dlg = $(doc).find("#ep-dialog-scheda");
    openDialogBasic(doc, $, $dlg, "Vedi Scheda?");

    $(doc).find("#ep-scheda-yes").off("click.scheda").on("click.scheda", function () {
      debugLog("[scheda] CLICK: Si");
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }

      waitOwnPgName(12, 120, (name) => {
        let finalName = name;
        if (!finalName) {
          try {
            finalName = (doc.defaultView || w.window).prompt("Inserisci il nome del personaggio:");
            finalName = (finalName || "").toString().trim() || null;
          } catch (_) { finalName = null; }
        }
        if (finalName) openSchedaViewer(finalName);
      });
    });

    $(doc).find("#ep-scheda-no").off("click.scheda").on("click.scheda", function () {
      debugLog("[scheda] CLICK: No");
      try { $dlg.dialog("close"); } catch (_) { $dlg.remove(); }

      let other = null;
      try {
        other = (doc.defaultView || w.window).prompt("Inserisci il nome del personaggio:");
        other = (other || "").toString().trim() || null;
      } catch (_) { other = null; }

      if (other) openSchedaViewer(other);
    });
  }

  // =========================
  // API pubblica
  // =========================
  w.vedischeda = function () {
    debugLog("[scheda] vedischeda invoked");
    appendToUiWhenReady((doc) => {
      const $ = get$ForDoc(doc);

      LAST_UI_DOC = doc;
      LAST_UI_$ = $;

      if (!doc?.body || !$) {
        debugLog("[scheda] abort missing doc/$", { url: doc?.URL, has$: !!$ });
        return;
      }
      if (!($.fn && typeof $.fn.dialog === "function")) {
        debugLog("[scheda] abort: jQuery UI dialog missing");
        return;
      }

      ensureSchedaStyle(doc);
      showMainDialog(doc, $);
    });
  };

  try { if (w.top && w.top !== w) w.top.vedischeda = w.vedischeda; } catch (_) {}

})(window);
