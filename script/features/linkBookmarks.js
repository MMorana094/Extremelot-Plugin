// script/features/linkBookmarks.js
// Link Bookmark manager (tabella + add + persistenza locale)
// UI: overlay factory (top-mounted) con iframe about:blank, contenuto iniettato.
// NOTE: i link si aprono in nuova scheda (esterno). Back arrow disabilitata.

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
    // se non ha schema, prova https://
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
      --bg:#f8e9aa;
      --border:#6e0000;
      --text:#111;
      --muted:#555;
      --row:#fff7cf;
      --row2:#fff2b7;
      --btn:#ffffff;
    }

    html,body{height:100%;}
    body{
      margin:0;
      font-family: Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .wrap{
      height:100%;
      display:flex;
      flex-direction:column;
    }

    .topbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:10px 12px;
      border-bottom:1px solid rgba(0,0,0,0.15);
      gap:10px;
    }

    .title{
      font-weight:700;
      font-size:14px;
      letter-spacing:0.2px;
    }

    .actions{
      display:flex;
      gap:8px;
      align-items:center;
    }

    .btn{
      border:1px solid rgba(0,0,0,0.25);
      background:var(--btn);
      border-radius:8px;
      padding:6px 10px;
      cursor:pointer;
      font-size:13px;
      line-height:1;
      user-select:none;
    }
    .btn:hover{filter:brightness(0.98);}
    .btn:active{transform:translateY(1px);}

    .btnPlus{
      width:28px; height:28px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-weight:800;
      border-radius:10px;
    }

    .tableWrap{
      padding:10px 12px 12px;
      overflow:auto;
      flex:1;
    }

    table{
      width:100%;
      border-collapse:separate;
      border-spacing:0;
      overflow:hidden;
      border:1px solid rgba(0,0,0,0.18);
      border-radius:10px;
      background:#fff;
    }

    thead th{
      text-align:left;
      font-size:12px;
      color:var(--muted);
      background:#fff;
      padding:10px;
      border-bottom:1px solid rgba(0,0,0,0.12);
    }

    tbody td{
      padding:8px 10px;
      border-bottom:1px solid rgba(0,0,0,0.08);
      vertical-align:middle;
      background: var(--row);
    }

    tbody tr:nth-child(even) td{ background: var(--row2); }
    tbody tr:last-child td{ border-bottom:none; }

    .in{
      width:100%;
      box-sizing:border-box;
      border:1px solid rgba(0,0,0,0.18);
      border-radius:8px;
      padding:7px 8px;
      font-size:13px;
      background:#fff;
      outline:none;
    }
    .in:focus{
      border-color: rgba(110,0,0,0.5);
      box-shadow: 0 0 0 2px rgba(110,0,0,0.12);
    }

    .colName{ width:35%; }
    .colLink{ width:45%; }
    .colOpen{ width:20%; }

    .rowBtns{
      display:flex;
      gap:8px;
      justify-content:flex-end;
      align-items:center;
    }

    .btnOpen{
      padding:7px 10px;
      border-radius:8px;
      font-weight:700;
    }

    .btnDel{
      padding:7px 10px;
      border-radius:8px;
      color:#800;
      border-color: rgba(128,0,0,0.28);
    }

    .empty{
      padding:10px 2px;
      color:var(--muted);
      font-size:13px;
    }

    /* modal add */
    .modalBack{
      position:fixed; inset:0;
      background:rgba(0,0,0,0.25);
      display:none;
      align-items:center;
      justify-content:center;
      z-index:9999;
    }
    .modal{
      width:min(520px, calc(100vw - 24px));
      background:#fff;
      border:3px solid var(--border);
      border-radius:12px;
      box-shadow:0 10px 40px rgba(0,0,0,0.35);
      overflow:hidden;
    }
    .modalHead{
      background:var(--border);
      color:#fff;
      padding:10px 12px;
      font-weight:700;
      display:flex;
      justify-content:space-between;
      align-items:center;
    }
    .modalBody{
      padding:12px;
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    .modalRow label{
      display:block;
      font-size:12px;
      color:#444;
      margin:0 0 6px 0;
    }
    .modalFoot{
      padding:12px;
      display:flex;
      justify-content:flex-end;
      gap:10px;
      border-top:1px solid rgba(0,0,0,0.10);
      background:#fafafa;
    }
  </style>
</head>
<body>
  <div class="wrap" id="ep-lb-root">
    <div class="topbar">
      <div class="title">Link Bookmark</div>
      <div class="actions">
        <button class="btn btnPlus" id="ep-lb-add" title="Aggiungi">+</button>
      </div>
    </div>

    <div class="tableWrap">
      <table aria-label="Bookmarks">
        <thead>
          <tr>
            <th class="colName">Nome Sito</th>
            <th class="colLink">Modifica Link</th>
            <th class="colOpen">Apri</th>
          </tr>
        </thead>
        <tbody id="ep-lb-tbody">
          <tr><td colspan="3" class="empty">Caricamento…</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="modalBack" id="ep-lb-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Aggiungi bookmark">
      <div class="modalHead">
        <div>Aggiungi bookmark</div>
        <button class="btn" id="ep-lb-modal-x" title="Chiudi">✕</button>
      </div>
      <div class="modalBody">
        <div class="modalRow">
          <label for="ep-lb-new-name">Nome Sito</label>
          <input class="in" id="ep-lb-new-name" placeholder="es. Wiki LOT" />
        </div>
        <div class="modalRow">
          <label for="ep-lb-new-url">Link</label>
          <input class="in" id="ep-lb-new-url" placeholder="es. https://..." />
        </div>
      </div>
      <div class="modalFoot">
        <button class="btn" id="ep-lb-cancel">Annulla</button>
        <button class="btn btnOpen" id="ep-lb-save">Salva</button>
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
    const btnX = doc.getElementById("ep-lb-modal-x");
    const btnCancel = doc.getElementById("ep-lb-cancel");
    const btnSave = doc.getElementById("ep-lb-save");
    const inName = doc.getElementById("ep-lb-new-name");
    const inUrl = doc.getElementById("ep-lb-new-url");

    let bookmarks = [];
    let saveTimer = null;

    function scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveBookmarks(bookmarks).catch(() => {});
      }, 450);
    }

    function openModal() {
      modal.style.display = "flex";
      inName.value = "";
      inUrl.value = "";
      setTimeout(() => inName.focus(), 10);
    }

    function closeModal() {
      modal.style.display = "none";
    }

    function render() {
      if (!tbody) return;

      if (!bookmarks.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty">Nessun bookmark. Premi “+” per aggiungerne uno.</td></tr>`;
        return;
      }

      tbody.innerHTML = bookmarks
        .map((b) => {
          const name = escapeHtml(b.name);
          const url = escapeHtml(b.url);
          return `
            <tr data-id="${escapeHtml(b.id)}">
              <td class="colName">
                <input class="in ep-lb-name" value="${name}" placeholder="Nome…" />
              </td>
              <td class="colLink">
                <input class="in ep-lb-url" value="${url}" placeholder="https://…" />
              </td>
              <td class="colOpen">
                <div class="rowBtns">
                  <button class="btn btnDel ep-lb-del" title="Rimuovi">✕</button>
                  <button class="btn btnOpen ep-lb-open" title="Apri in nuova scheda">Apri</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    function findById(id) {
      return bookmarks.find((x) => x.id === id) || null;
    }

    function updateFromRow(tr) {
      const id = tr.getAttribute("data-id");
      const b = findById(id);
      if (!b) return;

      const nameIn = tr.querySelector(".ep-lb-name");
      const urlIn = tr.querySelector(".ep-lb-url");

      b.name = String(nameIn?.value || "").trim();
      b.url = String(urlIn?.value || "").trim();
      scheduleSave();
    }

    async function boot() {
      bookmarks = await loadBookmarks();
      render();
    }

    // Add / modal
    btnAdd?.addEventListener("click", openModal);
    btnX?.addEventListener("click", closeModal);
    btnCancel?.addEventListener("click", closeModal);

    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    btnSave?.addEventListener("click", async () => {
      const name = String(inName?.value || "").trim();
      const url = String(inUrl?.value || "").trim();
      if (!name && !url) return;

      bookmarks.unshift({
        id: uid(),
        name: name || "(senza nome)",
        url: url,
      });

      await saveBookmarks(bookmarks);
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

      if (e.target?.closest?.(".ep-lb-open")) {
        updateFromRow(tr); // salva eventuali modifiche
        const finalUrl = normalizeUrl(b.url);
        if (!finalUrl) return;

        // ✅ Apri fuori (nuova scheda), NON navigare nell'iframe
        try {
          w.open(finalUrl, "_blank", "noopener,noreferrer");
        } catch (_) {}

        return;
      }
    });

    // Auto-save su input (delegate + debounce)
    tbody?.addEventListener("input", (e) => {
      const tr = e.target?.closest?.("tr[data-id]");
      if (!tr) return;
      if (e.target?.classList?.contains("ep-lb-name") || e.target?.classList?.contains("ep-lb-url")) {
        updateFromRow(tr);
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

    // ✅ back arrow disabilitata per Link Bookmarks
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