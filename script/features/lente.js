// /script/features/lente.js
// SRP: aprire e gestire SOLO il frame/overlay della descrizione luogo

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const DESCR_URL = "https://www.extremelot.eu/proc/vedi_desc_21.asp";

  const WRAP_ID = "ep-descLuogo-wrap";
  const IFRAME_ID = "ep-descLuogo-iframe";
  const BAR_ID = "ep-descLuogo-bar";
  const SLIDER_ID = "ep-descLuogo-opacity";
  const BTN_MIN_ID = "ep-descLuogo-min";
  const BTN_CLOSE_ID = "ep-descLuogo-close";
  const RESIZE_ID = "ep-descLuogo-resize";

  // Dimensione iniziale (ridotta)
  const DEFAULT_W = 820;
  const DEFAULT_H = 520;

  // Limiti
  const MIN_W = 380;
  const MIN_H = 160;

  // Margini e snap
  const EDGE_PAD = 10;     // non permettere “fuori schermo”
  const SNAP_PX = 18;      // distanza per magnete

  function getTargetDocument() {
    const cached = w.ExtremePlug?.menu?._lastTargetDoc;
    if (cached?.body) return cached;

    const resultWin = w.top?.result;
    if (resultWin?.document?.body) return resultWin.document;

    if (w.document?.body) return w.document;
    return null;
  }

  function removeIfExists(doc) {
    try {
      const old = doc.getElementById(WRAP_ID);
      if (old) old.remove();
    } catch (_) {}
  }

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) return min;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  function pxToNum(v, fallback) {
    const n = parseInt(String(v || ""), 10);
    return isFinite(n) ? n : fallback;
  }

  function snapToEdge(value, edgeValue, snapPx) {
    return Math.abs(value - edgeValue) <= snapPx ? edgeValue : value;
  }

  function open() {
    const doc = getTargetDocument();
    const win = doc?.defaultView || w;

    debugLog("[lente] open()", { hasBody: !!doc?.body });
    if (!doc?.body) return;

    // toggle
    const existing = doc.getElementById(WRAP_ID);
    if (existing) {
      existing.remove();
      return;
    }

    /* ================= WRAPPER ================= */
    const wrap = doc.createElement("div");
    wrap.id = WRAP_ID;
    wrap.style.position = "fixed";
    wrap.style.zIndex = "2147483647";
    wrap.style.background = "#fff";
    wrap.style.border = "1px solid rgba(0,0,0,0.35)";
    wrap.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
    wrap.style.borderRadius = "8px";
    wrap.style.overflow = "hidden";
    wrap.style.opacity = "1";
    wrap.dataset.minimized = "0";

    const vw = win.innerWidth || 1200;
    const vh = win.innerHeight || 800;

    const w0 = clamp(DEFAULT_W, MIN_W, vw - 2 * EDGE_PAD);
    const h0 = clamp(DEFAULT_H, MIN_H, vh - 2 * EDGE_PAD);

    const left0 = clamp(Math.round((vw - w0) / 2), EDGE_PAD, vw - w0 - EDGE_PAD);
    const top0 = clamp(Math.round((vh - h0) / 2), EDGE_PAD, vh - h0 - EDGE_PAD);

    wrap.style.left = left0 + "px";
    wrap.style.top = top0 + "px";
    wrap.style.width = w0 + "px";
    wrap.style.height = h0 + "px";

    // stato "aperto" per ripristino dopo minimize
    wrap.dataset.openLeft = wrap.style.left;
    wrap.dataset.openTop = wrap.style.top;
    wrap.dataset.openW = wrap.style.width;
    wrap.dataset.openH = wrap.style.height;

    /* ================= BAR ================= */
    const bar = doc.createElement("div");
    bar.id = BAR_ID;
    bar.style.height = "34px";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.justifyContent = "space-between";
    bar.style.padding = "0 10px";
    bar.style.background = "#6e0000";
    bar.style.borderBottom = "1px solid rgba(0,0,0,0.12)";
    bar.style.font = "13px Arial";
    bar.style.userSelect = "none";
    bar.style.cursor = "move";

    const title = doc.createElement("div");
    title.textContent = "Descrizione del luogo";
    title.style.color = "#FFFFFF";
    title.style.fontWeight = "700";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.paddingRight = "10px";

    const controls = doc.createElement("div");
    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.gap = "10px";

    /* ====== OPACITY (PRIMO) ====== */
    const slider = doc.createElement("input");
    slider.id = SLIDER_ID;
    slider.type = "range";
    slider.min = "20";
    slider.max = "100";
    slider.value = "100";
    slider.style.width = "110px";
    slider.style.cursor = "pointer";

    slider.addEventListener("input", () => {
      wrap.style.opacity = String((parseInt(slider.value, 10) || 100) / 100);
    });

    /* ====== MINIMIZE (SECONDO) ====== */
    const btnMin = doc.createElement("button");
    btnMin.id = BTN_MIN_ID;
    btnMin.textContent = "–";
    btnMin.title = "Minimizza";
    btnMin.style.border = "0";
    btnMin.style.background = "transparent";
    btnMin.style.fontSize = "22px";
    btnMin.style.cursor = "pointer";
    btnMin.style.padding = "0 6px";
    btnMin.style.marginTop = "-2px";

    /* ====== CLOSE (TERZO) ====== */
    const btnClose = doc.createElement("button");
    btnClose.id = BTN_CLOSE_ID;
    btnClose.textContent = "✕";
    btnClose.title = "Chiudi";
    btnClose.style.border = "0";
    btnClose.style.background = "transparent";
    btnClose.style.fontSize = "18px";
    btnClose.style.cursor = "pointer";
    btnClose.style.padding = "0 6px";

    btnClose.addEventListener("click", () => removeIfExists(doc));

    /* ====== ORDINE RICHIESTO: Opacity / Minimize / Close ====== */
    controls.appendChild(slider);
    controls.appendChild(btnMin);
    controls.appendChild(btnClose);

    bar.appendChild(title);
    bar.appendChild(controls);

    /* ================= IFRAME ================= */
    const iframe = doc.createElement("iframe");
    iframe.id = IFRAME_ID;
    iframe.src = DESCR_URL;
    iframe.style.width = "100%";
    iframe.style.height = "calc(100% - 34px)";
    iframe.style.border = "0";

    /* ================= RESIZE (bottom-right) ================= */
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

    resizer.addEventListener("mousedown", (e) => {
      if (wrap.dataset.minimized === "1") return;
      e.preventDefault?.();
      e.stopPropagation?.();

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = wrap.getBoundingClientRect();

      const startW = rect.width;
      const startH = rect.height;

      function onMove(ev) {
        const vw2 = win.innerWidth || vw;
        const vh2 = win.innerHeight || vh;

        let newW = clamp(startW + (ev.clientX - startX), MIN_W, vw2 - EDGE_PAD);
        let newH = clamp(startH + (ev.clientY - startY), MIN_H, vh2 - EDGE_PAD);

        // snap a “massimo” (se vicino al bordo destro/basso)
        const maxW = vw2 - EDGE_PAD;
        const maxH = vh2 - EDGE_PAD;
        newW = snapToEdge(newW, maxW, SNAP_PX);
        newH = snapToEdge(newH, maxH, SNAP_PX);

        wrap.style.width = Math.round(newW) + "px";
        wrap.style.height = Math.round(newH) + "px";
      }

      function onUp() {
        win.removeEventListener("mousemove", onMove, true);
        win.removeEventListener("mouseup", onUp, true);

        // salva per restore
        wrap.dataset.openLeft = wrap.style.left;
        wrap.dataset.openTop = wrap.style.top;
        wrap.dataset.openW = wrap.style.width;
        wrap.dataset.openH = wrap.style.height;

        debugLog("[lente] resize end", { w: wrap.style.width, h: wrap.style.height });
      }

      win.addEventListener("mousemove", onMove, true);
      win.addEventListener("mouseup", onUp, true);
    });

    /* ================= DRAG + SNAP (title bar) ================= */
    bar.addEventListener("mousedown", (e) => {
      if (wrap.dataset.minimized === "1") return;

      // se clicchi sui controlli NON trascinare
      const t = e.target;
      if (t && t.closest && t.closest(`#${BTN_MIN_ID}, #${BTN_CLOSE_ID}, #${SLIDER_ID}`)) {
        return;
      }

      e.preventDefault?.();

      const startX = e.clientX;
      const startY = e.clientY;

      const rect = wrap.getBoundingClientRect();
      const startLeft = pxToNum(wrap.style.left, rect.left);
      const startTop = pxToNum(wrap.style.top, rect.top);

      const curW = rect.width;
      const curH = rect.height;

      function onMove(ev) {
        const vw2 = win.innerWidth || 1200;
        const vh2 = win.innerHeight || 800;

        let nl = startLeft + (ev.clientX - startX);
        let nt = startTop + (ev.clientY - startY);

        // limiti base
        nl = clamp(nl, EDGE_PAD, vw2 - curW - EDGE_PAD);
        nt = clamp(nt, EDGE_PAD, vh2 - curH - EDGE_PAD);

        // snap ai bordi
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
        win.removeEventListener("mousemove", onMove, true);
        win.removeEventListener("mouseup", onUp, true);

        // salva per restore
        wrap.dataset.openLeft = wrap.style.left;
        wrap.dataset.openTop = wrap.style.top;
        wrap.dataset.openW = wrap.style.width;
        wrap.dataset.openH = wrap.style.height;

        debugLog("[lente] drag end", { left: wrap.style.left, top: wrap.style.top });
      }

      win.addEventListener("mousemove", onMove, true);
      win.addEventListener("mouseup", onUp, true);
    });

    /* ================= MINIMIZE LOGIC ================= */
    btnMin.addEventListener("click", () => {
      const isMin = wrap.dataset.minimized === "1";
      wrap.dataset.minimized = isMin ? "0" : "1";

      if (!isMin) {
        // salva stato aperto
        wrap.dataset.openLeft = wrap.style.left;
        wrap.dataset.openTop = wrap.style.top;
        wrap.dataset.openW = wrap.style.width;
        wrap.dataset.openH = wrap.style.height;

        // barra in basso a destra
        wrap.style.left = "";
        wrap.style.top = "";
        wrap.style.right = "12px";
        wrap.style.bottom = "12px";
        wrap.style.width = "420px";
        wrap.style.height = "34px";

        iframe.style.display = "none";
        resizer.style.display = "none";
        bar.style.cursor = "default";

        btnMin.textContent = "▢";
        btnMin.title = "Ripristina";
      } else {
        wrap.style.right = "";
        wrap.style.bottom = "";

        wrap.style.left = wrap.dataset.openLeft || (left0 + "px");
        wrap.style.top = wrap.dataset.openTop || (top0 + "px");
        wrap.style.width = wrap.dataset.openW || (w0 + "px");
        wrap.style.height = wrap.dataset.openH || (h0 + "px");

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
    doc.body.appendChild(wrap);

    debugLog("[lente] frame pronto (snap + ordine controlli ok)");
  }

  w.ExtremePlug.features.lente = { open };
})(window);
