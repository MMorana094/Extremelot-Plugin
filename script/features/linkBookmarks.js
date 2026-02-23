// script/features/linkBookmarks.js
// Link Bookmark manager (tabella LOT + add/edit + persistenza locale)
// UI: overlay factory (top-mounted) con iframe about:blank, contenuto iniettato.
// NOTE: i link si aprono in nuova scheda (esterno).

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
  w.ExtremePlug.features.linkBookmarks = w.ExtremePlug.features.linkBookmarks || {};

  const api = w.ExtremePlug.features.linkBookmarks;
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  const factory = w.ExtremePlug?.ui?.overlay?.createOverlay;
  if (typeof factory !== "function") {
    debugLog("[linkBookmarks] overlay factory mancante: carica /script/ui/overlay.js prima di questo file");
    api.open = function () {};
    api.close = function () {};
    api.toggle = function () {};
    return;
  }

  const STORAGE_KEY = "EP_LINK_BOOKMARKS_V1";

  function storageGet(key) {
    return new Promise((resolve) => {
      try {
        if (!w.chrome?.storage?.local) return resolve(null);
        chrome.storage.local.get([key], (res) => resolve(res ? res[key] : null));
      } catch (_) {
        resolve(null);
      }
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      try {
        if (!w.chrome?.storage?.local) return resolve(false);
        chrome.storage.local.set({ [key]: value }, () => resolve(true));
      } catch (_) {
        resolve(false);
      }
    });
  }

  function normalizeUrl(u) {
    const s = String(u || "").trim();
    if (!s) return "";
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return "https://" + s;
    return s;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadBookmarks() {
    const raw = await storageGet(STORAGE_KEY);
    if (!raw) return [];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => ({
        id: String(x?.id || ""),
        name: String(x?.name || ""),
        url: String(x?.url || ""),
        desc: String(x?.desc || ""),
      }))
      .filter((x) => x.id);
  }

  async function saveBookmarks(list) {
    const clean = Array.isArray(list) ? list : [];
    await storageSet(STORAGE_KEY, clean);
  }

  function uid() {
    try {
      return crypto?.randomUUID?.() || ("id_" + Date.now() + "_" + Math.random().toString(16).slice(2));
    } catch (_) {
      return "id_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }
  }

  // ---------------------------------------------------------
  // UI injection inside iframe about:blank
  // ---------------------------------------------------------
  function ensureIframeUI(iframe) {
    const doc = iframe?.contentDocument;
    if (!doc) return null;

    if (doc.getElementById("ep-lb-root")) return doc;

    doc.open();
    doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Link Bookmark</title>
  <style>
    :root{
      --bg: #f8e9aa;         /* fondo giallo LOT */
      --header: #6e0000;     /* rosso scuro */
      --grid: #d7caa0;       /* bordo griglia */
      --rowA: #f7e7b1;       /* giallino */
      --rowB: #c9cf86;       /* verdino */
      --text: #1b1b1b;
    }

    html,body{ height:100%; }
    body{
      margin:0;
      background: var(--bg);
      font-family: Arial, sans-serif;
      color: var(--text);
    }

    .wrap{
      height:100%;
      display:flex;
      flex-direction:column;
      padding:10px;
      box-sizing:border-box;
    }

    .toolbar{
      display:flex;
      justify-content:flex-end;
      align-items:center;
      gap:8px;
      margin-bottom:8px;
    }
    /* Bottone + stile titlebar */
    .btnPlus{
      width:28px;
      height:28px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-weight:800;
      font-size:18px;
      line-height:1;
      border-radius:6px;
      border:1px solid rgba(0,0,0,0.35);
      background: var(--header);   /* stesso rosso titlebar */
      color:#ffffff;               /* + chiaro */
      cursor:pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25);
    }

    .btnPlus:hover{
      filter: brightness(1.08);
    }

    .btnPlus:active{
      transform: translateY(1px);
    }
    .btn{
      cursor:pointer;
      user-select:none;
      border:1px solid rgba(0,0,0,0.25);
      background:#fff;
      border-radius:6px;
      padding:6px 10px;
      font-size:13px;
      line-height:1;
    }
    .btn:active{ transform: translateY(1px); }

    .tableWrap{
      flex:1;
      overflow:auto;
    }

    table{
      width:100%;
      border-collapse:separate;
      border-spacing:0;
      table-layout:fixed;
      border:1px solid var(--grid);
      background: transparent;
    }

    thead th{
      background: var(--header);
      color:#fff;
      font-weight:700;
      font-size:12px;
      padding:6px 8px;
      border-right:1px solid rgba(255,255,255,0.25);
      text-align:center;
    }
    thead th:first-child{ width:42px; }
    thead th:nth-child(2){ text-align:left; }
    thead th:nth-child(3){ width:130px; }
    thead th:nth-child(4){ width:110px; }
    thead th:nth-child(5){ width:110px; }
    thead th:last-child{ border-right:0; }

    tbody td{
      padding:6px 8px;
      border-top:1px solid var(--grid);
      border-right:1px solid var(--grid);
      vertical-align:middle;
      font-size:12px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    tbody td:last-child{ border-right:0; }

    tbody tr:nth-child(odd) td{ background: var(--rowA); }
    tbody tr:nth-child(even) td{ background: var(--rowB); }

    .siteCell{
      text-align:left;
      white-space:normal;
      overflow:visible;
    }
    .siteName{
      font-weight:700;
      font-size:12px;
      line-height:1.1;
      margin:0;
    }
    .siteDesc{
      font-size:11px;
      opacity:0.9;
      line-height:1.1;
      margin:2px 0 0 0;
    }

    .iconCell{ text-align:center; }
    .actCell{ text-align:center; }

    .icoBtn{
      width:26px;
      height:26px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      border:0;
      background:transparent;
      padding:0;
      margin:0;
    }
    .icoBtn:active{ transform: translateY(1px); }

    .svg{
      width:20px;
      height:20px;
      display:block;
      filter: drop-shadow(0 1px 0 rgba(0,0,0,0.25));
    }

    /* icone gif LOT */
    .icoImg{
      width:20px;
      height:20px;
      display:block;
    }

    /* favicon (icona sito) */
    .favImg{
      width:16px;
      height:16px;
      display:block;
      image-rendering:auto;
    }

    .empty{
      padding:10px;
      text-align:center;
      font-size:13px;
      opacity:0.85;
    }

    /* Modal */
    .modalBack{
      position:fixed; inset:0;
      background:rgba(0,0,0,0.35);
      display:none;
      align-items:center;
      justify-content:center;
      z-index:9999;
    }
    .modal{
      width:min(560px, calc(100vw - 24px));
      background:#fff;
      border:3px solid var(--header);
      border-radius:10px;
      overflow:hidden;
      box-shadow:0 10px 40px rgba(0,0,0,0.35);
    }
    .modalHead{
      background: var(--header);
      color:#fff;
      padding:8px 10px;
      font-weight:700;
      display:flex;
      justify-content:space-between;
      align-items:center;
      font-size:13px;
    }
    .modalBody{
      padding:10px;
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    .modalRow label{
      display:block;
      font-size:12px;
      margin:0 0 6px 0;
      color:#333;
    }
    .in{
      width:100%;
      box-sizing:border-box;
      border:1px solid rgba(0,0,0,0.25);
      border-radius:6px;
      padding:7px 8px;
      font-size:13px;
      outline:none;
    }
    .in:focus{
      border-color: rgba(110,0,0,0.6);
      box-shadow: 0 0 0 2px rgba(110,0,0,0.15);
    }
    .modalFoot{
      display:flex;
      justify-content:flex-end;
      gap:8px;
      padding:10px;
      border-top:1px solid rgba(0,0,0,0.12);
      background:#fafafa;
    }
  </style>
</head>
<body>
  <div class="wrap" id="ep-lb-root">
    <div class="toolbar">
      <button class="btnPlus" id="ep-lb-add" title="Aggiungi">+</button>
    </div>

    <div class="tableWrap">
      <table aria-label="Bookmarks">
        <thead>
          <tr>
            <th></th>
            <th style="text-align:left">Sito Web</th>
            <th>LINK</th>
            <th>Modifica</th>
            <th>Cancella</th>
          </tr>
        </thead>
        <tbody id="ep-lb-tbody">
          <tr><td colspan="5" class="empty">Caricamento…</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="modalBack" id="ep-lb-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Bookmark">
      <div class="modalHead">
        <div id="ep-lb-modal-title">Aggiungi</div>
        <button class="btn" id="ep-lb-modal-x" title="Chiudi">✕</button>
      </div>
      <div class="modalBody">
        <div class="modalRow">
          <label for="ep-lb-in-name">Nome Sito</label>
          <input class="in" id="ep-lb-in-name" placeholder="es. Bottega Armi" />
        </div>
        <div class="modalRow">
          <label for="ep-lb-in-desc">Descrizione (facoltativa)</label>
          <input class="in" id="ep-lb-in-desc" placeholder="es. Descrizione facoltativa" />
        </div>
        <div class="modalRow">
          <label for="ep-lb-in-url">Link</label>
          <input class="in" id="ep-lb-in-url" placeholder="es. https://..." />
        </div>
      </div>
      <div class="modalFoot">
        <button class="btn" id="ep-lb-cancel">Annulla</button>
        <button class="btn" id="ep-lb-save">Salva</button>
      </div>
    </div>
  </div>
</body>
</html>`);
    doc.close();

    return doc;
  }

  function mountLogic(iframe) {
    const doc = iframe?.contentDocument;
    if (!doc) return;

    // evita doppio mount
    if (doc.__epLbMounted) return;
    doc.__epLbMounted = true;

    const tbody = doc.getElementById("ep-lb-tbody");
    const btnAdd = doc.getElementById("ep-lb-add");

    const modal = doc.getElementById("ep-lb-modal");
    const modalTitle = doc.getElementById("ep-lb-modal-title");
    const btnX = doc.getElementById("ep-lb-modal-x");
    const btnCancel = doc.getElementById("ep-lb-cancel");
    const btnSave = doc.getElementById("ep-lb-save");

    const inName = doc.getElementById("ep-lb-in-name");
    const inDesc = doc.getElementById("ep-lb-in-desc");
    const inUrl = doc.getElementById("ep-lb-in-url");

    let bookmarks = [];
    let saveTimer = null;

    // modalità modal: add o edit
    let editId = null;

    // (1) e (2) icone LOT
    const ICON_DEL = "https://www.extremelot.eu/lotnew/img/features/eliminamsg2.gif";
    const ICON_EDIT = "https://www.extremelot.eu/lotnew/img/features/rispondimsg2.gif";

    function scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveBookmarks(bookmarks).catch(() => {});
      }, 350);
    }

    function playIconSvg() {
      // "tastino play" per la colonna LINK
      return `
        <svg class="svg" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,0,0,0.65)" stroke-width="2"/>
          <path d="M10 8l6 4-6 4z" fill="rgba(0,0,0,0.75)"/>
        </svg>`;
    }

    function safeOriginFavicon(url) {
      // favicon del sito: origin + /favicon.ico
      try {
        const u = new URL(normalizeUrl(url));
        return u.origin.replace(/\/+$/, "") + "/favicon.ico";
      } catch (_) {
        return "";
      }
    }

    function attachFaviconFallbacks() {
      // se favicon non esiste -> fallback "globo"
      try {
        const imgs = doc.querySelectorAll("img.ep-lb-fav");
        imgs.forEach((img) => {
          if (img.__epBound) return;
          img.__epBound = true;

          img.addEventListener(
            "error",
            () => {
              try {
                const svg = `
                  <svg class="svg" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(0,0,0,0.65)" stroke-width="2"/>
                    <path d="M3 12h18" stroke="rgba(0,0,0,0.35)" stroke-width="1.6"/>
                    <path d="M12 3c3.5 3.5 3.5 14 0 18" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.6"/>
                    <path d="M12 3c-3.5 3.5-3.5 14 0 18" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.6"/>
                  </svg>`;
                const span = doc.createElement("span");
                span.innerHTML = svg;
                img.replaceWith(span.firstElementChild);
              } catch (_) {}
            },
            { once: true }
          );
        });
      } catch (_) {}
    }

    function openModal(mode, b) {
      editId = mode === "edit" ? String(b?.id || "") : null;

      modalTitle.textContent = mode === "edit" ? "Modifica" : "Aggiungi";
      inName.value = String(b?.name || "");
      inDesc.value = String(b?.desc || "");
      inUrl.value = String(b?.url || "");

      modal.style.display = "flex";
      setTimeout(() => inName.focus(), 10);
    }

    function closeModal() {
      modal.style.display = "none";
      editId = null;
    }

    function findById(id) {
      return bookmarks.find((x) => x.id === id) || null;
    }

    function render() {
      if (!tbody) return;

      if (!bookmarks.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty">Nessun bookmark.</td></tr>`;
        return;
      }

      tbody.innerHTML = bookmarks
        .map((b) => {
          const id = escapeHtml(b.id);
          const name = escapeHtml(b.name || "(senza nome)");
          const desc = escapeHtml(b.desc || "Descrizione facoltativa");

          // ✅ favicon nella PRIMA colonna (icona sito)
          const fav = safeOriginFavicon(b.url);
          const favHtml = fav
            ? `<img class="favImg ep-lb-fav" src="${escapeHtml(fav)}" alt="" referrerpolicy="no-referrer" />`
            : "";

          return `
            <tr data-id="${id}">
              <td class="iconCell">
                ${favHtml || ""}
              </td>
              <td class="siteCell">
                <div class="siteName">${name}</div>
                <div class="siteDesc">${desc}</div>
              </td>
              <td class="actCell">
                <button class="icoBtn ep-lb-open" title="Apri">
                  ${playIconSvg()}
                </button>
              </td>
              <td class="actCell">
                <button class="icoBtn ep-lb-edit" title="Modifica">
                  <img class="icoImg" src="${escapeHtml(ICON_EDIT)}" alt="Modifica" referrerpolicy="no-referrer" />
                </button>
              </td>
              <td class="actCell">
                <button class="icoBtn ep-lb-del" title="Cancella">
                  <img class="icoImg" src="${escapeHtml(ICON_DEL)}" alt="Cancella" referrerpolicy="no-referrer" />
                </button>
              </td>
            </tr>
          `;
        })
        .join("");

      attachFaviconFallbacks();
    }

    async function boot() {
      bookmarks = await loadBookmarks();

      // retro-compat: se in passato non c'era desc, normalizza
      bookmarks = bookmarks.map((b) => ({
        id: String(b.id || uid()),
        name: String(b.name || ""),
        url: String(b.url || ""),
        desc: String(b.desc || ""),
      }));

      render();
    }

    // Toolbar
    btnAdd?.addEventListener("click", () => openModal("add", null));

    // Modal
    btnX?.addEventListener("click", closeModal);
    btnCancel?.addEventListener("click", closeModal);

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    btnSave?.addEventListener("click", async () => {
      const name = String(inName?.value || "").trim();
      const desc = String(inDesc?.value || "").trim();
      const url = String(inUrl?.value || "").trim();

      if (!name && !url && !desc) return;

      if (editId) {
        const b = findById(editId);
        if (b) {
          b.name = name || "(senza nome)";
          b.desc = desc || "";
          b.url = url || "";
          scheduleSave();
        }
      } else {
        bookmarks.unshift({
          id: uid(),
          name: name || "(senza nome)",
          desc: desc || "",
          url: url || "",
        });
        await saveBookmarks(bookmarks);
      }

      closeModal();
      render();
    });

    // Table interactions (delegate)
    tbody?.addEventListener("click", async (e) => {
      const tr = e.target?.closest?.("tr[data-id]");
      if (!tr) return;

      const id = tr.getAttribute("data-id");
      const b = findById(id);
      if (!b) return;

      if (e.target?.closest?.(".ep-lb-del")) {
        bookmarks = bookmarks.filter((x) => x.id !== id);
        await saveBookmarks(bookmarks);
        render();
        return;
      }

      if (e.target?.closest?.(".ep-lb-edit")) {
        openModal("edit", b);
        return;
      }

      if (e.target?.closest?.(".ep-lb-open")) {
        const finalUrl = normalizeUrl(b.url);
        if (!finalUrl) return;

        try {
          w.open(finalUrl, "_blank", "noopener,noreferrer");
        } catch (_) {}
        return;
      }
    });

    boot().catch((e) => debugLog("[linkBookmarks] boot err", e));
  }

  // ---------------------------------------------------------
  // Overlay config
  // ---------------------------------------------------------
  const overlay = factory({
    id: "ep-link-bookmarks-wrap",
    url: "about:blank",
    title: "Link Bookmark",

    // LinkBookmarks non naviga dentro iframe: back inutile
    backButton: false,

    ids: {
      iframe: "ep-link-bookmarks-iframe",
      bar: "ep-link-bookmarks-bar",
      slider: "ep-link-bookmarks-opacity",
      btnMin: "ep-link-bookmarks-min",
      btnClose: "ep-link-bookmarks-close",
      resizer: "ep-link-bookmarks-resize",
    },
    size: { w: 920, h: 520, minW: 520, minH: 260 },
    snap: { edgePad: 10, snapPx: 18 },
    theme: {
      wrapBorder: "1px solid rgba(0,0,0,0.35)",
      barBg: "#6e0000",
      barBorderBottom: "1px solid rgba(0,0,0,0.12)",
      barTextColor: "#FFFFFF",
      titleColor: "#FFFFFF",
    },
    minimize: { w: 520, h: 34, right: 12, bottom: 12 },
    onAfterMount: function ({ iframe }) {
      try {
        ensureIframeUI(iframe);
        mountLogic(iframe);
        debugLog("[linkBookmarks] mounted");
      } catch (e) {
        debugLog("[linkBookmarks] mount failed", e);
      }
    },
  });

  api.open = overlay.open;
  api.close = overlay.close;
  api.toggle = overlay.toggle;

  // Export su top
  try {
    if (w.top && w.top !== w) {
      w.top.ExtremePlug = w.top.ExtremePlug || {};
      w.top.ExtremePlug.features = w.top.ExtremePlug.features || {};
      w.top.ExtremePlug.features.linkBookmarks = api;
    }
  } catch (_) {}

  debugLog("[linkBookmarks] loaded");
})(window);