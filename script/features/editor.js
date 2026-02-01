// /script/features/editor.js
// FRAME/TAB-SAFE + UI + CONTACARATTERI + OPACITY SLIDER + CLOSE
// PATCH: mount SEMPRE su top.document.documentElement (come lente/bacheca/azioni)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.editor = w.ExtremePlug.editor || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const MAXLEN = 2000;

  const ROOT_ID = "ep-overlay-root"; // stesso root usato dalle finestre iframe
  const WRAP_ID = "ep-editor-wrap";
  const RESIZE_ID = "ep-editor-resize";

  const EDGE_PAD = 10;
  const SNAP_PX = 18;

  const DEFAULT_W = 640;
  const DEFAULT_H = 380;

  const MIN_W = 550;
  const MIN_H = 280;

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
    root.style.position = "fixed";
    root.style.left = "0";
    root.style.top = "0";
    root.style.width = "0";
    root.style.height = "0";
    root.style.zIndex = "2147483647";
    root.style.pointerEvents = "none";

    doc.documentElement.appendChild(root);
    return root;
  }

  function removeIfExists(doc) {
    try {
      const old = doc.getElementById(WRAP_ID);
      if (old) old.remove();
    } catch (_) {}
  }

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) n = min;
    max = Math.max(max, min);
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function snapToEdge(value, edgeValue, snapPx) {
    return Math.abs(value - edgeValue) <= snapPx ? edgeValue : value;
  }

  function updateCounter(doc) {
    const ta = doc.getElementById("ep-editor-textarea");
    const cc = doc.getElementById("ep-editor-counter");
    if (!ta || !cc) return;
    cc.textContent = `${ta.value.length}/${MAXLEN}`;
  }

  function applyOpacity(doc, value) {
    const v = Number(value);
    const op = Math.max(0.2, Math.min(1, (isFinite(v) ? v : 100) / 100));
    const wrap = doc.getElementById(WRAP_ID);
    if (wrap) wrap.style.opacity = String(op);
  }

  function buildUI(doc) {
    const wrap = doc.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.position = "fixed";
    wrap.style.zIndex = "2147483647";
    wrap.style.background = "#fff";
    wrap.style.border = "1px solid rgba(0,0,0,0.35)";
    wrap.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
    wrap.style.borderRadius = "10px";
    wrap.style.overflow = "hidden";
    wrap.style.pointerEvents = "auto";
    wrap.style.transform = "none";
    wrap.style.opacity = "1";
    wrap.dataset.minimized = "0";
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";

    const bar = doc.createElement("div");
    bar.className = "ep-editor-dragbar";
    bar.title = "Trascina per spostare";
    bar.style.height = "34px";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.justifyContent = "space-between";
    bar.style.padding = "0 10px";
    bar.style.background = "#6e0000";
    bar.style.borderBottom = "1px solid rgba(0,0,0,0.12)";
    bar.style.userSelect = "none";
    bar.style.cursor = "move";
    bar.style.font = "13px Arial";

    const title = doc.createElement("div");
    title.textContent = "Editor";
    title.style.fontWeight = "700";
    title.style.color = "#FFFFFF";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.paddingRight = "10px";

    const controls = doc.createElement("div");
    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.gap = "10px";

    // Opacity slider
    const opWrap = doc.createElement("div");
    opWrap.style.display = "flex";
    opWrap.style.alignItems = "center";
    opWrap.style.gap = "6px";

    const opLabel = doc.createElement("span");
    opLabel.textContent = "Opacity";
    opLabel.style.fontSize = "12px";
    opLabel.style.color = "#444";
    opLabel.style.whiteSpace = "nowrap";

    const slider = doc.createElement("input");
    slider.type = "range";
    slider.min = "20";
    slider.max = "100";
    slider.value = "100";
    slider.style.width = "110px";
    slider.style.cursor = "pointer";
    slider.addEventListener("input", (e) => {
      try { e.stopPropagation?.(); } catch (_) {}
      applyOpacity(doc, slider.value);
    });
    slider.addEventListener("mousedown", (e) => {
      try { e.stopPropagation?.(); } catch (_) {}
    });

    opWrap.appendChild(opLabel);
    opWrap.appendChild(slider);

    // Close button
    const btnClose = doc.createElement("button");
    btnClose.textContent = "✕";
    btnClose.title = "Chiudi";
    btnClose.style.border = "0";
    btnClose.style.color = "#FFF";
    btnClose.style.background = "transparent";
    btnClose.style.fontSize = "18px";
    btnClose.style.cursor = "pointer";
    btnClose.style.padding = "0 6px";
    btnClose.addEventListener("click", () => removeIfExists(doc));

    controls.appendChild(opWrap);
    controls.appendChild(btnClose);

    bar.appendChild(title);
    bar.appendChild(controls);

    // Body
    const body = doc.createElement("div");
    body.style.padding = "10px";
    body.style.background = "#f6f6f6";
    body.style.flex = "1";
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.minHeight = "0";


    const ta = doc.createElement("textarea");
    ta.id = "ep-editor-textarea";
    ta.placeholder = "Scrivi la tua azione";
    ta.maxLength = MAXLEN;
    ta.style.width = "100%";
    ta.style.flex = "1";
    ta.style.minHeight = "160px";
    ta.style.resize = "none";
    ta.style.height = "auto";
    ta.style.padding = "8px";
    ta.style.border = "1px solid #bbb";
    ta.style.borderRadius = "6px";
    ta.style.fontFamily = "Arial, sans-serif";
    ta.style.fontSize = "14px";
    ta.style.boxSizing = "border-box";
    ta.style.background = "#fff";

    ta.addEventListener("input", () => updateCounter(doc));

    const row = doc.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.gap = "10px";
    row.style.marginTop = "8px";

    const actions = doc.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "6px";
    actions.style.alignItems = "center";

    const btnCopy = doc.createElement("button");
    btnCopy.textContent = "Copia";
    btnCopy.type = "button";
    btnCopy.style.padding = "6px 12px";
    btnCopy.style.border = "1px solid #aaa";
    btnCopy.style.borderRadius = "6px";
    btnCopy.style.background = "#fff";
    btnCopy.style.cursor = "pointer";

    btnCopy.addEventListener("click", () => {
      ta.focus();
      ta.select();
      // mantengo il tuo storico: cut
      try { doc.execCommand("cut"); } catch (_) {}
      updateCounter(doc);
    });

    const btnClose2 = doc.createElement("button");
    btnClose2.textContent = "Chiudi";
    btnClose2.type = "button";
    btnClose2.style.padding = "6px 12px";
    btnClose2.style.border = "1px solid #aaa";
    btnClose2.style.borderRadius = "6px";
    btnClose2.style.background = "#fff";
    btnClose2.style.cursor = "pointer";
    btnClose2.addEventListener("click", () => removeIfExists(doc));

    actions.appendChild(btnCopy);
    actions.appendChild(btnClose2);

    const counter = doc.createElement("div");
    counter.id = "ep-editor-counter";
    counter.textContent = `0/${MAXLEN}`;
    counter.style.fontSize = "12px";
    counter.style.padding = "2px 8px";
    counter.style.border = "1px solid #ddd";
    counter.style.borderRadius = "999px";
    counter.style.background = "#fff";
    counter.style.whiteSpace = "nowrap";

    row.appendChild(actions);
    row.appendChild(counter);

    body.appendChild(ta);
    body.appendChild(row);

    // Resize handle (bottom-right)
    const resizer = doc.createElement("div");
    resizer.id = RESIZE_ID;
    resizer.title = "Ridimensiona";
    resizer.style.position = "absolute";
    resizer.style.right = "0";
    resizer.style.bottom = "0";
    resizer.style.width = "16px";
    resizer.style.height = "16px";
    resizer.style.cursor = "se-resize";
    resizer.style.background =
      "linear-gradient(225deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0) 60%)";

    wrap.appendChild(bar);
    wrap.appendChild(body);
    wrap.appendChild(resizer);

    return { wrap, bar, ta, slider, resizer };
  }

  function apriEditor() {
    const topWin = getTopWin();
    const doc = topWin.document;
    const root = getRoot(topWin);

    debugLog("[editor] apriEditor() top-mount", { hasDoc: !!doc, hasRoot: !!root });
    if (!doc || !root) return;

    // toggle (se già aperto, chiudi)
    const existing = doc.getElementById(WRAP_ID);
    if (existing) {
      existing.remove();
      debugLog("[editor] chiuso (toggle)");
      return;
    }

    const { wrap, bar, ta, slider, resizer } = buildUI(doc);

    const vw = topWin.innerWidth || 1200;
    const vh = topWin.innerHeight || 800;

    const w0 = clamp(DEFAULT_W, MIN_W, vw - 2 * EDGE_PAD);
    const h0 = clamp(DEFAULT_H, MIN_H, vh - 2 * EDGE_PAD);

    const left0 = clamp(Math.round((vw - w0) / 2), EDGE_PAD, vw - w0 - EDGE_PAD);
    const top0 = clamp(Math.round((vh - h0) / 2), EDGE_PAD, vh - h0 - EDGE_PAD);

    wrap.style.left = left0 + "px";
    wrap.style.top = top0 + "px";
    wrap.style.width = w0 + "px";
    wrap.style.height = h0 + "px";

    wrap.dataset.openLeft = wrap.style.left;
    wrap.dataset.openTop = wrap.style.top;
    wrap.dataset.openW = wrap.style.width;
    wrap.dataset.openH = wrap.style.height;

    // Drag + snap
    bar.addEventListener("mousedown", (e) => {
      // non trascinare mentre tocchi lo slider o dentro bottoni
      if (e.target && e.target.closest && e.target.closest("input,button,textarea")) return;

      e.preventDefault?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = wrap.getBoundingClientRect();

      const startLeft = rect.left;
      const startTop = rect.top;
      const curW = rect.width;
      const curH = rect.height;

      function onMove(ev) {
        const vw2 = topWin.innerWidth || vw;
        const vh2 = topWin.innerHeight || vh;

        let nl = startLeft + (ev.clientX - startX);
        let nt = startTop + (ev.clientY - startY);

        nl = clamp(nl, EDGE_PAD, vw2 - curW - EDGE_PAD);
        nt = clamp(nt, EDGE_PAD, vh2 - curH - EDGE_PAD);

        const leftEdge = EDGE_PAD;
        const topEdge = EDGE_PAD;
        const rightEdge = vw2 - curW - EDGE_PAD;
        const bottomEdge = vh2 - curH - EDGE_PAD;

        nl = snapToEdge(nl, leftEdge, SNAP_PX);
        nl = snapToEdge(nl, rightEdge, SNAP_PX);
        nt = snapToEdge(nt, topEdge, SNAP_PX);
        nt = snapToEdge(nt, bottomEdge, SNAP_PX);

        wrap.style.left = Math.round(nl) + "px";
        wrap.style.top = Math.round(nt) + "px";
      }

      function onUp() {
        topWin.removeEventListener("mousemove", onMove, true);
        topWin.removeEventListener("mouseup", onUp, true);
      }

      topWin.addEventListener("mousemove", onMove, true);
      topWin.addEventListener("mouseup", onUp, true);
    });

    // Resize bottom-right
    resizer.addEventListener("mousedown", (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = wrap.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;

      function onMove(ev) {
        const vw2 = topWin.innerWidth || vw;
        const vh2 = topWin.innerHeight || vh;

        let newW = clamp(startW + (ev.clientX - startX), MIN_W, vw2 - EDGE_PAD);
        let newH = clamp(startH + (ev.clientY - startY), MIN_H, vh2 - EDGE_PAD);

        const maxW = vw2 - EDGE_PAD;
        const maxH = vh2 - EDGE_PAD;

        newW = snapToEdge(newW, maxW, SNAP_PX);
        newH = snapToEdge(newH, maxH, SNAP_PX);

        wrap.style.width = Math.round(newW) + "px";
        wrap.style.height = Math.round(newH) + "px";
      }

      function onUp() {
        topWin.removeEventListener("mousemove", onMove, true);
        topWin.removeEventListener("mouseup", onUp, true);
      }

      topWin.addEventListener("mousemove", onMove, true);
      topWin.addEventListener("mouseup", onUp, true);
    });

    // init counter + opacity
    updateCounter(doc);
    applyOpacity(doc, slider.value);

    root.appendChild(wrap);
    ta.focus();

    debugLog("[editor] aperto (top-mounted)");
  }

  // API legacy + SRP
  w.apriEditor = apriEditor;
  w.ExtremePlug.editor.apriEditor = apriEditor;
  w.ExtremePlug.editor.apri = apriEditor;
})(window);
