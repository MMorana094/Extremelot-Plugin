// /script/ui/overlay.js
// Overlay Factory (DRAG + RESIZE + OPACITY + MINIMIZE + TOP-MOUNT, frame-safe)
//
// Questo modulo centralizza tutta la logica degli overlay.
// Requisito: caricare questo file PRIMA dei file features che lo usano.

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.ui = w.ExtremePlug.ui || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const ROOT_ID = "ep-overlay-root";

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) n = min;
    max = Math.max(max, min); // safe se max < min
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function snapToEdge(value, edgeValue, snapPx) {
    return Math.abs(value - edgeValue) <= snapPx ? edgeValue : value;
  }

  function getTopWin() {
    try {
      return w.top || w;
    } catch (_) {
      return w;
    }
  }

  function getRoot(topWin) {
    const doc = topWin.document;
    if (!doc?.documentElement) return null;

    let root = doc.getElementById(ROOT_ID);
    if (root) return root;

    root = doc.createElement("div");
    root.id = ROOT_ID;

    // container sopra tutto, indipendente da body/frameset
    root.style.position = "fixed";
    root.style.left = "0";
    root.style.top = "0";
    root.style.width = "0";
    root.style.height = "0";
    root.style.zIndex = "2147483647";
    root.style.pointerEvents = "none"; // i figli riabilitano

    doc.documentElement.appendChild(root);
    return root;
  }

  /**
   * createOverlay(config) -> { open, close, toggle }
   *
   * config:
   *  - id: string (obbligatorio) -> id wrapper (univoco)
   *  - url: string OR () => string (obbligatorio)
   *  - title: string (obbligatorio)
   *  - ids?: { iframe, bar, slider, btnMin, btnClose, resizer } (opzionali, utili per debug/CSS)
   *  - size?: { w, h, minW, minH }
   *  - snap?: { edgePad, snapPx }
   *  - theme?: { wrapBorder, barBg, barBorderBottom, barTextColor, titleColor }
   *  - minimize?: { w, h, right, bottom }  (dimensioni quando minimizzato)
   *  - onAfterMount?: (ctx) => void
   */
  function createOverlay(config) {
    const cfg = config || {};
    const id = String(cfg.id || "").trim();
    if (!id) {
      debugLog("[overlay] createOverlay: manca config.id");
      return { open: function () {}, close: function () {}, toggle: function () {} };
    }

    const ids = cfg.ids || {};
    const size = cfg.size || {};
    const snap = cfg.snap || {};
    const theme = cfg.theme || {};
    const minimize = cfg.minimize || {};

    const DEFAULT_W = clamp(size.w ?? 820, 200, 3000);
    const DEFAULT_H = clamp(size.h ?? 520, 120, 3000);
    const MIN_W = clamp(size.minW ?? 380, 200, 3000);
    const MIN_H = clamp(size.minH ?? 160, 80, 3000);

    const EDGE_PAD = clamp(snap.edgePad ?? 10, 0, 120);
    const SNAP_PX = clamp(snap.snapPx ?? 18, 0, 120);

    const MINIMIZED_W = clamp(minimize.w ?? 420, 180, 1200);
    const MINIMIZED_H = clamp(minimize.h ?? 34, 28, 80);
    const MINIMIZED_RIGHT = clamp(minimize.right ?? 12, 0, 80);
    const MINIMIZED_BOTTOM = clamp(minimize.bottom ?? 12, 0, 80);

    const WRAP_BORDER = theme.wrapBorder ?? "1px solid rgba(0,0,0,0.35)";
    const BAR_BG = theme.barBg ?? "#6e0000";
    const BAR_BORDER_BOTTOM = theme.barBorderBottom ?? "1px solid rgba(0,0,0,0.12)";
    const BAR_TEXT = theme.barTextColor ?? "#FFFFFF";
    const TITLE_COLOR = theme.titleColor ?? BAR_TEXT;

    function resolveUrl() {
      try {
        return typeof cfg.url === "function" ? cfg.url() : String(cfg.url || "");
      } catch (e) {
        debugLog("[overlay] resolveUrl error", e);
        return "";
      }
    }

    function close() {
      const topWin = getTopWin();
      const doc = topWin?.document;
      if (!doc) return;
      const existing = doc.getElementById(id);
      if (existing) existing.remove();
    }

    function open() {
      const topWin = getTopWin();
      const doc = topWin.document;
      const root = getRoot(topWin);

      if (!doc || !root) return;

      // toggle (default)
      const existing = doc.getElementById(id);
      if (existing) {
        existing.remove();
        return;
      }

      const vw = topWin.innerWidth || 1200;
      const vh = topWin.innerHeight || 800;

      /* ================= WRAPPER ================= */
      const wrap = doc.createElement("div");
      wrap.id = id;
      wrap.style.position = "fixed";
      wrap.style.zIndex = "2147483647";
      wrap.style.background = "#fff";
      wrap.style.border = WRAP_BORDER;
      wrap.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
      wrap.style.borderRadius = "8px";
      wrap.style.overflow = "hidden";
      wrap.style.opacity = "1";
      wrap.style.pointerEvents = "auto"; // ✅ cliccabile
      wrap.style.transform = "none"; // evita containing block strani
      wrap.dataset.minimized = "0";

      const w0 = clamp(DEFAULT_W, MIN_W, vw - 2 * EDGE_PAD);
      const h0 = clamp(DEFAULT_H, MIN_H, vh - 2 * EDGE_PAD);

      const left0 = clamp(
        Math.round((vw - w0) / 2),
        EDGE_PAD,
        Math.max(EDGE_PAD, vw - w0 - EDGE_PAD)
      );
      const top0 = clamp(
        Math.round((vh - h0) / 2),
        EDGE_PAD,
        Math.max(EDGE_PAD, vh - h0 - EDGE_PAD)
      );

      wrap.style.left = left0 + "px";
      wrap.style.top = top0 + "px";
      wrap.style.width = w0 + "px";
      wrap.style.height = h0 + "px";

      // stato per restore
      wrap.dataset.openLeft = wrap.style.left;
      wrap.dataset.openTop = wrap.style.top;
      wrap.dataset.openW = wrap.style.width;
      wrap.dataset.openH = wrap.style.height;

      /* ================= BAR ================= */
      const bar = doc.createElement("div");
      if (ids.bar) bar.id = ids.bar;
      bar.style.height = "34px";
      bar.style.display = "flex";
      bar.style.alignItems = "center";
      bar.style.justifyContent = "space-between";
      bar.style.padding = "0 10px";
      bar.style.background = BAR_BG;
      bar.style.borderBottom = BAR_BORDER_BOTTOM;
      bar.style.font = "13px Arial";
      bar.style.userSelect = "none";
      bar.style.cursor = "move";
      bar.style.color = BAR_TEXT;

      const title = doc.createElement("div");
      title.textContent = String(cfg.title || "");
      title.style.fontWeight = "700";
      title.style.whiteSpace = "nowrap";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";
      title.style.paddingRight = "10px";
      title.style.color = TITLE_COLOR;

      const controls = doc.createElement("div");
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.style.gap = "10px";
      controls.style.color = BAR_TEXT;

      const slider = doc.createElement("input");
      if (ids.slider) slider.id = ids.slider;
      slider.type = "range";
      slider.min = "0.25";
      slider.max = "1";
      slider.step = "0.05";
      slider.value = "1";
      slider.title = "Opacità";
      slider.style.width = "120px";

      const btnMin = doc.createElement("button");
      if (ids.btnMin) btnMin.id = ids.btnMin;
      btnMin.textContent = "–";
      btnMin.title = "Minimizza";
      btnMin.style.cursor = "pointer";
      btnMin.style.border = "0";
      btnMin.style.background = "transparent";
      btnMin.style.color = BAR_TEXT;
      btnMin.style.fontSize = "18px";
      btnMin.style.lineHeight = "1";
      btnMin.style.padding = "0 6px";

      const btnClose = doc.createElement("button");
      if (ids.btnClose) btnClose.id = ids.btnClose;
      btnClose.textContent = "✕";
      btnClose.title = "Chiudi";
      btnClose.style.cursor = "pointer";
      btnClose.style.border = "0";
      btnClose.style.background = "transparent";
      btnClose.style.color = BAR_TEXT;
      btnClose.style.fontSize = "18px";
      btnClose.style.lineHeight = "1";
      btnClose.style.padding = "0 6px";

      controls.appendChild(slider);
      controls.appendChild(btnMin);
      controls.appendChild(btnClose);
      bar.appendChild(title);
      bar.appendChild(controls);

      /* ================= IFRAME ================= */
      const iframe = doc.createElement("iframe");
      if (ids.iframe) iframe.id = ids.iframe;
      iframe.src = resolveUrl();
      iframe.style.width = "100%";
      iframe.style.height = "calc(100% - 34px)";
      iframe.style.border = "0";
      iframe.style.display = "block";
      iframe.style.background = "#fff";

      /* ================= RESIZER ================= */
      const resizer = doc.createElement("div");
      if (ids.resizer) resizer.id = ids.resizer;
      resizer.style.position = "absolute";
      resizer.style.right = "0";
      resizer.style.bottom = "0";
      resizer.style.width = "16px";
      resizer.style.height = "16px";
      resizer.style.cursor = "nwse-resize";
      resizer.style.background =
        "linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.25) 100%)";

      /* ================= EVENTS: CLOSE/OPACITY ================= */
      btnClose.addEventListener("click", () => wrap.remove());
      slider.addEventListener("input", () => {
        wrap.style.opacity = String(slider.value);
      });

      // ✅ FIX: impedisci che lo slider triggeri il drag
      const stopDragFromControls = (e) => {
        try { e.stopPropagation(); } catch (_) {}
        try { e.stopImmediatePropagation(); } catch (_) {}
      };
      ["pointerdown", "mousedown", "touchstart"].forEach((evt) => {
        slider.addEventListener(evt, stopDragFromControls, true);
      });

      /* ================= DRAG + SNAP ================= */
      bar.addEventListener("mousedown", (ev) => {
        if (wrap.dataset.minimized === "1") return;

        ev.preventDefault();

        const rect = wrap.getBoundingClientRect();
        const startX = ev.clientX;
        const startY = ev.clientY;
        const startLeft = rect.left;
        const startTop = rect.top;

        function onMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          const curW = rect.width;
          const curH = rect.height;

          let newLeft = clamp(startLeft + dx, EDGE_PAD, Math.max(EDGE_PAD, vw - curW - EDGE_PAD));
          let newTop = clamp(startTop + dy, EDGE_PAD, Math.max(EDGE_PAD, vh - curH - EDGE_PAD));

          newLeft = snapToEdge(newLeft, EDGE_PAD, SNAP_PX);
          newTop = snapToEdge(newTop, EDGE_PAD, SNAP_PX);
          newLeft = snapToEdge(newLeft, vw - curW - EDGE_PAD, SNAP_PX);
          newTop = snapToEdge(newTop, vh - curH - EDGE_PAD, SNAP_PX);

          wrap.style.left = newLeft + "px";
          wrap.style.top = newTop + "px";

          wrap.dataset.openLeft = wrap.style.left;
          wrap.dataset.openTop = wrap.style.top;
        }

        function onUp() {
          topWin.removeEventListener("mousemove", onMove, true);
          topWin.removeEventListener("mouseup", onUp, true);
        }

        topWin.addEventListener("mousemove", onMove, true);
        topWin.addEventListener("mouseup", onUp, true);
      });

      /* ================= RESIZE + SNAP ================= */
      resizer.addEventListener("mousedown", (ev) => {
        if (wrap.dataset.minimized === "1") return;

        ev.preventDefault();

        const rect = wrap.getBoundingClientRect();
        const startX = ev.clientX;
        const startY = ev.clientY;
        const startW = rect.width;
        const startH = rect.height;

        function onMove(e) {
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          const left = rect.left;
          const top = rect.top;

          const maxW = vw - left - EDGE_PAD;
          const maxH = vh - top - EDGE_PAD;

          let newW = clamp(startW + dx, MIN_W, maxW);
          let newH = clamp(startH + dy, MIN_H, maxH);

          newW = snapToEdge(newW, maxW, SNAP_PX);
          newH = snapToEdge(newH, maxH, SNAP_PX);

          wrap.style.width = newW + "px";
          wrap.style.height = newH + "px";

          wrap.dataset.openW = wrap.style.width;
          wrap.dataset.openH = wrap.style.height;
        }

        function onUp() {
          topWin.removeEventListener("mousemove", onMove, true);
          topWin.removeEventListener("mouseup", onUp, true);
        }

        topWin.addEventListener("mousemove", onMove, true);
        topWin.addEventListener("mouseup", onUp, true);
      });

      /* ================= MINIMIZE ================= */
      btnMin.addEventListener("click", () => {
        const isMin = wrap.dataset.minimized === "1";
        wrap.dataset.minimized = isMin ? "0" : "1";

        if (!isMin) {
          // salva stato “aperto”
          wrap.dataset.openLeft = wrap.style.left;
          wrap.dataset.openTop = wrap.style.top;
          wrap.dataset.openW = wrap.style.width;
          wrap.dataset.openH = wrap.style.height;

          wrap.style.left = "";
          wrap.style.top = "";
          wrap.style.right = MINIMIZED_RIGHT + "px";
          wrap.style.bottom = MINIMIZED_BOTTOM + "px";
          wrap.style.width = MINIMIZED_W + "px";
          wrap.style.height = MINIMIZED_H + "px";

          iframe.style.display = "none";
          resizer.style.display = "none";
          bar.style.cursor = "default";

          btnMin.textContent = "▢";
          btnMin.title = "Ripristina";
        } else {
          wrap.style.right = "";
          wrap.style.bottom = "";

          wrap.style.left = wrap.dataset.openLeft || left0 + "px";
          wrap.style.top = wrap.dataset.openTop || top0 + "px";
          wrap.style.width = wrap.dataset.openW || w0 + "px";
          wrap.style.height = wrap.dataset.openH || h0 + "px";

          iframe.style.display = "block";
          resizer.style.display = "block";
          bar.style.cursor = "move";

          btnMin.textContent = "–";
          btnMin.title = "Minimizza";
        }
      });

      /* ================= MOUNT ================= */
      wrap.appendChild(bar);
      wrap.appendChild(iframe);
      wrap.appendChild(resizer);

      root.appendChild(wrap);

      try {
        cfg.onAfterMount && cfg.onAfterMount({ topWin, doc, root, wrap, bar, iframe });
      } catch (e) {
        debugLog("[overlay] onAfterMount error", e);
      }
    }

    function toggle() {
      const topWin = getTopWin();
      const doc = topWin?.document;
      if (!doc) return;
      const existing = doc.getElementById(id);
      if (existing) close();
      else open();
    }

    return { open, close, toggle };
  }

  // =========================================================
  // jQuery UI Overlay helpers (centralizzazione UI jQueryUI)
  // =========================================================
  w.ExtremePlug.ui.overlay = w.ExtremePlug.ui.overlay || {};
  w.ExtremePlug.ui.overlay.createOverlay = createOverlay;

  // Namespace jqui
  const jqui = (w.ExtremePlug.ui.overlay.jqui = w.ExtremePlug.ui.overlay.jqui || {});

  jqui.ensureDialogStyle = function ensureDialogStyle(doc, theme) {
    try {
      if (!doc?.head) return;
      const ns = String(theme?.ns || "base");
      const styleId = "extremeplug-jqui-overlay-style-" + ns;
      if (doc.getElementById(styleId)) return;

      const dialogClass = String(theme?.dialogClass || "ep-jqui-overlay");
      const bg = String(theme?.bg || "#fff");
      const border = String(theme?.border || "rgba(0,0,0,0.35)");
      const titleBg = String(theme?.titleBg || "#6e0000");
      const titleColor = String(theme?.titleColor || "#fff");

      // ✅ PATCH: opzionale hide buttonpane (per dialog "card" senza pulsanti jQueryUI)
      const hideButtonPane = !!theme?.hideButtonPane;

      const st = doc.createElement("style");
      st.id = styleId;

      st.textContent = `
        .ui-dialog.${dialogClass}{
          z-index: 9999999 !important;
          background: ${bg} !important;
          border: 3px solid ${border} !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 10px 40px rgba(0,0,0,.35) !important;
        }
        .ui-widget-overlay{ z-index: 9999998 !important; }

        .ui-dialog.${dialogClass} .ui-dialog-titlebar{
          background: ${titleBg} !important;
          border: 0 !important;
          border-bottom: 1px solid rgba(0,0,0,.55) !important;
          border-radius: 0 !important;
          padding: 4px 10px !important;
          min-height: 34px !important;
          position: relative !important;
          user-select: none !important;
        }

        .ui-dialog.${dialogClass} .ui-dialog-title{
          color:${titleColor} !important;
          font-weight:700 !important;
          font-size:13px !important;
          line-height:20px !important;
          text-shadow: 0 1px 0 rgba(0,0,0,.45) !important;
        }

        .ui-dialog.${dialogClass} .ui-dialog-content{
          padding:0 !important;
          margin:0 !important;
          overflow:hidden !important;
          background:${bg} !important;
        }

        /* ====== titlebar controls ====== */
        .ui-dialog.${dialogClass} .ep-title-controls{
          position:absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display:flex;
          align-items:center;
          gap:10px;
          z-index: 2;
        }

        .ui-dialog.${dialogClass} .ep-opacity-wrap{
          display:flex;
          align-items:center;
          gap:6px;
          color:${titleColor};
          font-size:12px;
          opacity:.95;
          white-space: nowrap;
        }

        .ui-dialog.${dialogClass} input.ep-opacity{
          width:120px;
          height: 12px;
          cursor: pointer;
        }

        .ui-dialog.${dialogClass} .ep-titlebtn{
          width: 26px;
          height: 18px;
          border-radius: 3px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          user-select:none;
          color:${titleColor};
          font-weight:800;
          line-height: 1;
          opacity:.95;
        }
        .ui-dialog.${dialogClass} .ep-titlebtn:hover{
          background: rgba(255,255,255,.10);
        }

        /* ✅ usa SOLO la X custom: nascondi la X nativa jQuery UI */
        .ui-dialog.${dialogClass} .ui-dialog-titlebar-close{ display:none !important; }

        ${hideButtonPane ? `.ui-dialog.${dialogClass} .ui-dialog-buttonpane{ display:none !important; }` : ``}
      `;

      doc.head.appendChild(st);
    } catch (_) {}
  };

  jqui.ensureIframeFill = function ensureIframeFill(doc, params) {
    try {
      if (!doc?.head) return;

      const ns = String(params?.ns || "generic");
      const styleId = "extremeplug-jqui-iframefill-" + ns;
      if (doc.getElementById(styleId)) return;

      const iframeClass = String(params?.iframeClass || "").trim();
      const dialogClass = String(params?.dialogClass || "").trim();
      const bg = String(params?.bg || "#fff");

      const st = doc.createElement("style");
      st.id = styleId;

      const rules = [];

      if (iframeClass) {
        rules.push(`
          .${iframeClass}{
            width:100% !important;
            height:100% !important;
            border:0 !important;
            display:block !important;
            background:${bg} !important;
          }
        `);
      }

      if (dialogClass) {
        rules.push(`
          .ui-dialog.${dialogClass} .ui-dialog-content{
            background:${bg} !important;
            padding:0 !important;
            margin:0 !important;
            overflow:hidden !important;
          }
        `);
      }

      st.textContent = rules.join("\n");
      doc.head.appendChild(st);
    } catch (_) {}
  };

  // controls per dialog: slider opacity + minimize + close
  jqui.addTitleControls = function addTitleControls(doc, $, $dlg, key, opts) {
    try {
      const $wrap = $dlg.closest(".ui-dialog");
      if (!$wrap.length) return;

      const $bar = $wrap.find(".ui-dialog-titlebar");
      if (!$bar.length) return;

      if ($bar.find(".ep-title-controls").length) return;

      const controls = doc.createElement("div");
      controls.className = "ep-title-controls";

      const opWrap = doc.createElement("div");
      opWrap.className = "ep-opacity-wrap";
      opWrap.title = "Opacità";

      const opLabel = doc.createElement("span");
      opLabel.textContent = "Opacity";

      const op = doc.createElement("input");
      op.className = "ep-opacity";
      op.type = "range";
      op.min = "25";
      op.max = "100";
      op.value = "100";

      opWrap.appendChild(opLabel);
      opWrap.appendChild(op);

      const btnMin = doc.createElement("div");
      btnMin.className = "ep-titlebtn ep-minbtn";
      btnMin.title = "Minimizza";
      btnMin.textContent = "–";

      const btnClose = doc.createElement("div");
      btnClose.className = "ep-titlebtn ep-xbtn";
      btnClose.title = "Chiudi";
      btnClose.textContent = "✕";

      controls.appendChild(opWrap);
      controls.appendChild(btnMin);
      controls.appendChild(btnClose);

      $bar.append(controls);

      const stopDragFromControls = (e) => {
        try { e.stopPropagation(); } catch (_) {}
        try { e.stopImmediatePropagation(); } catch (_) {}
        return false;
      };

      ["pointerdown", "mousedown", "touchstart"].forEach((evt) => {
        op.addEventListener(evt, stopDragFromControls, true);
        opWrap.addEventListener(evt, stopDragFromControls, true);
      });

      try {
        if (typeof $wrap.draggable === "function") {
          const cancelSel = [
            ".ep-title-controls",
            ".ep-opacity-wrap",
            "input.ep-opacity",
            "input",
            "button",
            "select",
            "textarea",
            "a",
          ].join(",");

          if ($wrap.data("ui-draggable") || $wrap.data("draggable")) {
            $wrap.draggable("option", "cancel", cancelSel);
          } else {
            setTimeout(() => {
              try {
                if ($wrap.data("ui-draggable") || $wrap.data("draggable")) {
                  $wrap.draggable("option", "cancel", cancelSel);
                }
              } catch (_) {}
            }, 0);
          }
        }
      } catch (_) {}

      const stateKey = "ep_jqui_state_" + String(key || "dlg");
      const win = doc.defaultView || w.window;

      const minWidth = Number(opts?.minWidth || 460);
      const dockPad = Number(opts?.dockPad || 12);
      const onClose = typeof opts?.onClose === "function" ? opts.onClose : null;

      const saveState = () => {
        const rect = $wrap[0].getBoundingClientRect();
        const st = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: parseFloat($wrap.css("opacity") || "1") || 1,
          minimized: false,
        };
        $wrap.data(stateKey, st);
      };

      const restoreState = () => {
        const st = $wrap.data(stateKey);
        if (!st) return;
        if (typeof st.left !== "number" || typeof st.top !== "number") return;
        if (typeof st.width !== "number" || typeof st.height !== "number") return;

        $wrap.css({
          left: Math.round(st.left) + "px",
          top: Math.round(st.top) + "px",
          width: Math.round(st.width) + "px",
          height: Math.round(st.height) + "px",
          opacity: st.opacity,
          position: "fixed",
        });
      };

      op.addEventListener("input", (e) => {
        try { e.stopPropagation(); } catch (_) {}
        const v = Math.max(0.25, Math.min(1, Number(op.value) / 100));
        $wrap.css("opacity", String(v));
        const st = $wrap.data(stateKey) || {};
        st.opacity = v;
        $wrap.data(stateKey, st);
      });

      // ✅ FIX CRITICO: non sovrascrivere lo state salvato da saveState()
      btnMin.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const st0 = $wrap.data(stateKey) || {};
        const isMin = !!st0.minimized;

        if (!isMin) {
          // salva lo stato completo (left/top/width/height)
          saveState();

          // ricarica lo state appena salvato (per non perderlo)
          const st = $wrap.data(stateKey) || {};

          const titleH = $wrap.find(".ui-dialog-titlebar").outerHeight(true) || 34;

          $dlg.hide();

          const vw = Math.max(320, win.innerWidth || 0);
          const vh = Math.max(240, win.innerHeight || 0);
          const pad = dockPad;

          $wrap.css({
            position: "fixed",
            width: minWidth + "px",
            height: titleH + 2 + "px",
            left: Math.max(pad, vw - minWidth - pad) + "px",
            top: Math.max(pad, vh - (titleH + 2) - pad) + "px",
          });

          st.minimized = true;
          $wrap.data(stateKey, st);

          btnMin.textContent = "▢";
          btnMin.title = "Ripristina";
        } else {
          const st = $wrap.data(stateKey) || {};
          st.minimized = false;
          $wrap.data(stateKey, st);

          restoreState();
          $dlg.show();

          btnMin.textContent = "–";
          btnMin.title = "Minimizza";
        }
      });

      btnClose.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { onClose && onClose(); } catch (_) {}
        try { $dlg.dialog("close"); } catch (_) {
          try { $wrap.remove(); } catch (_) {}
        }
      });

      setTimeout(() => {
        try {
          const st = $wrap.data(stateKey) || {};
          if (!st.opacity) st.opacity = parseFloat($wrap.css("opacity") || "1") || 1;
          if (st.left == null) saveState();
          $wrap.data(stateKey, st);
        } catch (_) {}
      }, 0);
    } catch (e) {
      debugLog("[overlay.jqui] addTitleControls error", { err: String(e?.message || e) });
    }
  };

  // =========================================================
  // ✅ helpers minimize/restore/toggle (riusabili dalle features)
  // =========================================================
  jqui.getState = function getState($dlg, key) {
    try {
      if (!$dlg || !$dlg.length) return null;
      const $wrap = $dlg.closest(".ui-dialog");
      if (!$wrap.length) return null;
      const stateKey = "ep_jqui_state_" + String(key || "dlg");
      return $wrap.data(stateKey) || null;
    } catch (_) {
      return null;
    }
  };

  jqui.isMinimized = function isMinimized($dlg, key) {
    try {
      const st = jqui.getState($dlg, key) || {};
      return !!st.minimized;
    } catch (_) {
      return false;
    }
  };

  jqui.restoreIfMinimized = function restoreIfMinimized($dlg, key) {
    try {
      if (!$dlg || !$dlg.length) return false;

      const $wrap = $dlg.closest(".ui-dialog");
      if (!$wrap.length) return false;

      if (!jqui.isMinimized($dlg, key)) return false;

      const $btn = $wrap.find(".ep-title-controls .ep-minbtn").first();
      if ($btn.length) {
        $btn.trigger("click");
        return true;
      }

      const stateKey = "ep_jqui_state_" + String(key || "dlg");
      const st = $wrap.data(stateKey) || {};
      st.minimized = false;
      $wrap.data(stateKey, st);
      $dlg.show();

      return true;
    } catch (_) {
      return false;
    }
  };

  jqui.toggleOrRestore = function toggleOrRestore($dlg, key, opts) {
    try {
      if (!$dlg || !$dlg.length) return false;

      if (jqui.restoreIfMinimized($dlg, key)) return true;

      try {
        const onClose = typeof opts?.onClose === "function" ? opts.onClose : null;
        try { onClose && onClose(); } catch (_) {}
        try { $dlg.dialog("close"); }
        catch (_) { try { $dlg.closest(".ui-dialog").remove(); } catch (_) {} }
      } catch (_) {}

      return true;
    } catch (_) {
      return false;
    }
  };
})(window);
