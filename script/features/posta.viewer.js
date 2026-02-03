// script/features/posta.viewer.js
// Posta - Viewer engine: fetch + render + hooks (click/submit) + routing interno
// Usato da script/features/posta.js (che gestisce solo dialog lifecycle + API)

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.postaViewer = w.ExtremePlug.features.postaViewer || {};
  const viewerAPI = w.ExtremePlug.features.postaViewer;

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  // ---------------------------------------------------------
  // Helpers URL / routing
  // ---------------------------------------------------------
  function baseFromUrl(u) {
    try {
      const x = new URL(u);
      x.pathname = x.pathname.replace(/[^/]+$/, "");
      return x.origin + x.pathname;
    } catch (_) {
      return "https://www.extremelot.eu/proc/posta/";
    }
  }

  function absUrl(href, baseHref) {
    try { return new URL(href, baseHref).href; } catch (_) { return null; }
  }

  function isExtremelotAsp(u) {
    try {
      const x = new URL(u);
      return x.hostname.includes("extremelot.eu") && x.pathname.toLowerCase().endsWith(".asp");
    } catch (_) {
      return false;
    }
  }

  function looksBlocked(html) {
    return /OPERAZIONE\s+NON\s+CONSENTITA/i.test(String(html));
  }

  function isComposeUrl(u) {
    const s = String(u).toLowerCase();
    return (
      s.includes("scrivialtri.asp") ||
      s.includes("scriviposta.asp") ||
      s.includes("scrivi") ||
      s.includes("rispondi") ||
      s.includes("apriposta.asp")
    );
  }

  // ---------------------------------------------------------
  // Fetch + render
  // ---------------------------------------------------------
  async function lotFetch(url, options) {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      redirect: "follow",
      ...(options || {}),
    });
    const text = await res.text();
    return { res, text };
  }

  function stripScripts(html) {
    return String(html).replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  }

  function getIframe(doc, iframeId) {
    try {
      return doc.getElementById(iframeId) || null;
    } catch (_) {
      return null;
    }
  }

  function getState(iframe, startUrl) {
    if (!iframe) return null;
    if (!iframe.__epPostaViewerState) {
      iframe.__epPostaViewerState = {
        currentBase: baseFromUrl(startUrl),
        hooksInstalled: false,
      };
    }
    return iframe.__epPostaViewerState;
  }

  function renderViewerHtml(doc, iframeId, html, baseHref, startUrl, onCompose) {
    const iframe = getIframe(doc, iframeId);
    if (!iframe) return;

    const fdoc = iframe.contentDocument;
    if (!fdoc) return;

    const cleaned = stripScripts(html);

    const out =
      "<!doctype html><html><head>" +
      '<meta charset="utf-8">' +
      '<base href="' + baseHref + '">' +
      "</head><body>" +
      cleaned +
      "</body></html>";

    fdoc.open();
    fdoc.write(out);
    fdoc.close();

    installViewerHooks(doc, iframeId, baseHref, startUrl, onCompose);
    debugLog("[POSTA][viewer] render ok", { base: baseHref });
  }

  async function navViewerGet(doc, iframeId, url, startUrl, onCompose) {
    const iframe = getIframe(doc, iframeId);
    if (!iframe) return;

    const st = getState(iframe, startUrl);
    if (!st) return;

    const { res, text } = await lotFetch(url, { method: "GET" });
    const finalUrl = res.url || url;

    if (looksBlocked(text)) {
      renderViewerHtml(
        doc,
        iframeId,
        "<div style='padding:12px;font-family:verdana;color:#800'>" +
          "<b>Operazione non consentita dal server.</b><br>" +
          "Questo viewer è solo per lettura; per scrivere/rispondere usa i pulsanti che aprono il composer interno." +
          "</div>",
        st.currentBase,
        startUrl,
        onCompose
      );
      return;
    }

    st.currentBase = baseFromUrl(finalUrl);
    renderViewerHtml(doc, iframeId, text, st.currentBase, startUrl, onCompose);
  }

  // ---------------------------------------------------------
  // Hooks: click + submit nel documento iframe
  // ---------------------------------------------------------
  function installViewerHooks(uiDoc, iframeId, baseHref, startUrl, onCompose) {
    const iframe = getIframe(uiDoc, iframeId);
    const fdoc = iframe?.contentDocument;
    if (!fdoc) return;

    const st = getState(iframe, startUrl);
    if (!st) return;

    if (fdoc.__epPostaHooks) return;
    fdoc.__epPostaHooks = true;

    fdoc.addEventListener(
      "click",
      function (e) {
        const a = e.target?.closest?.("a");
        if (!a) return;

        const href = a.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

        const u = absUrl(href, baseHref);
        if (!u || !isExtremelotAsp(u)) return;

        e.preventDefault?.();
        e.stopPropagation?.();

        if (isComposeUrl(u)) {
          debugLog("[POSTA][viewer] compose from viewer:", u);
          try { onCompose && onCompose(u); } catch (_) {}
          return;
        }

        debugLog("[POSTA][viewer] nav GET:", u);
        navViewerGet(uiDoc, iframeId, u, startUrl, onCompose);
      },
      true
    );

    fdoc.addEventListener(
      "submit",
      function (e) {
        const form = e.target;
        if (!form || form.tagName?.toLowerCase() !== "form") return;

        const action = form.getAttribute("action") || "";
        const method = (form.getAttribute("method") || "GET").toUpperCase();
        const actionUrl = absUrl(action || "", baseHref) || baseHref;

        // il viewer non deve fare POST: se è POST o sembra compose => composer
        if (method === "POST" || isComposeUrl(actionUrl)) {
          e.preventDefault?.();
          e.stopPropagation?.();
          debugLog("[POSTA][viewer] submit rerouted to composer:", actionUrl);
          try { onCompose && onCompose(actionUrl); } catch (_) {}
          return;
        }
      },
      true
    );

    debugLog("[POSTA][viewer] hooks installati");
  }

  // ---------------------------------------------------------
  // Public API
  // ---------------------------------------------------------
  /**
   * mount({ doc, iframeId, startUrl, onCompose })
   * - carica startUrl nel viewer iframe e installa hooks
   */
  viewerAPI.mount = function mount(opts) {
    const doc = opts?.doc;
    const iframeId = String(opts?.iframeId || "");
    const startUrl = String(opts?.startUrl || "");
    const onCompose = typeof opts?.onCompose === "function" ? opts.onCompose : null;

    if (!doc?.body || !iframeId || !startUrl) return;

    const iframe = getIframe(doc, iframeId);
    if (!iframe) return;

    // inizializza stato
    getState(iframe, startUrl);

    // avvia navigazione iniziale
    navViewerGet(doc, iframeId, startUrl, startUrl, onCompose)
      .catch((e) => console.error("[POSTA][viewer] nav start err", e));
  };

  /**
   * reset(doc, iframeId)
   * - pulisce hooks marker e state (utile se ricrei iframe)
   */
  viewerAPI.reset = function reset(doc, iframeId) {
    try {
      const iframe = getIframe(doc, iframeId);
      if (!iframe) return;
      try { delete iframe.__epPostaViewerState; } catch (_) { iframe.__epPostaViewerState = null; }
      try {
        const fdoc = iframe.contentDocument;
        if (fdoc) fdoc.__epPostaHooks = false;
      } catch (_) {}
    } catch (_) {}
  };

  // Export su top (coerenza con altre feature)
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.postaViewer = viewerAPI;
    }
  } catch (_) {}

  debugLog("[POSTA][viewer] loaded");
})(window);
