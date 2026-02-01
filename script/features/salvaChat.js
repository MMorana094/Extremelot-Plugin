// features/salvaChat.js
// SALVA CHAT (download locale) - frame-safe, no jQuery, no server
// Output HTML con stile simile al template LOT: sfondo #F8E9AA + header centrato
// Header: "Nome PG - Luogo - Data"

(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};

  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};

  function getTopWin() {
    try {
      return w.top || w;
    } catch (_) {
      return w;
    }
  }

  function getFrameDocByName(name, rootDoc) {
    try {
      const el = rootDoc.querySelector(`frame[name='${name}'], iframe[name='${name}']`);
      const doc = el?.contentWindow?.document;
      return doc && doc.body ? doc : null;
    } catch (_) {
      return null;
    }
  }

  // LOT: top -> frame result -> frame testo
  function getChatDoc() {
    const topWin = getTopWin();
    const topDoc = topWin.document;

    const resultDoc = getFrameDocByName("result", topDoc);
    if (!resultDoc) return null;

    const testoDoc = getFrameDocByName("testo", resultDoc);
    return testoDoc;
  }

  function getPgInfo() {
    const topWin = getTopWin();
    const topDoc = topWin.document;

    const logoDoc = getFrameDocByName("logo", topDoc);
    if (!logoDoc) return { nome: "Sconosciuto", luogo: "Luogo sconosciuto" };

    const nome = (logoDoc.querySelector("input[name='player']")?.value || "Sconosciuto").trim();

    let luogo = (logoDoc.querySelector("input[name='titolo']")?.value || "Luogo sconosciuto").trim();
    luogo = luogo.replace(/<\/?b>/gi, "").trim();

    return { nome, luogo };
  }

  function decodeOldQuotes(html) {
    // Compat vecchio formato: &lt; e &gt; -> « »
    return String(html || "")
      .replace(/\&gt;/g, "»</i>")
      .replace(/\&lt;/g, "<i>«");
  }

  function makeFileSafeName(s) {
    return String(s || "")
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
  }

  function pad2(n) {
    n = String(n);
    return n.length === 1 ? "0" + n : n;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatHumanDate(d) {
    const mesi = [
      "gennaio", "febbraio", "marzo", "aprile",
      "maggio", "giugno", "luglio", "agosto",
      "settembre", "ottobre", "novembre", "dicembre"
    ];
    return `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
  }

  function buildHtmlDocument({ nome, luogo, chatHtml, dataHuman }) {
    // Stile preso dal tuo template di riferimento :contentReference[oaicite:1]{index=1}
    // Titolo file: include timestamp leggibile + info base
    const d = new Date();
    const title = `[${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}] ${luogo} ${nome}`;

    return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <style>
    body {
      scrollbar-face-color: #F8E9AA;
      padding: 10px;
      scrollbar-arrow-color: #af7840;
      scrollbar-track-color: #F8E9AA;
      scrollbar-shadow-color: #af7840;
      scrollbar-highlight-color: #F8E9AA;
      scrollbar-3dlight-color: #FFFFFF;
      scrollbar-darkshadow-color: #F8E9AA;
      background-color: #F8E9AA;
    }
    i { color: #434343; }
  </style>
</head>
<body bgcolor="#F8E9AA" marginwidth="0" marginheight="0">
  <div style="text-align:justify; margin:5px;">
    <p style="font-size:18px; font-family:verdana; color:#808000; text-align:center;">
      ${escapeHtml(nome)} - ${escapeHtml(luogo)} - ${escapeHtml(dataHuman)}
    </p>
    <hr size="1">
    <font face="Verdana, Arial" size="2">
${chatHtml}
    </font>
  </div>
</body>
</html>`;
  }

  function downloadHtml(filename, text) {
    const topWin = getTopWin();
    const doc = topWin.document;

    // Assicura body disponibile
    if (!doc.body) {
      debugLog("[salva_chat] download: top document body missing");
      return false;
    }

    const blob = new Blob([text], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = doc.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    doc.body.appendChild(a);

    a.click();

    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch (_) {}
      try { a.remove(); } catch (_) {}
    }, 800);

    return true;
  }

  function toast(msg) {
    try {
      const topWin = getTopWin();
      const doc = topWin.document;

      const id = "ep-toast-salvachat";
      const old = doc.getElementById(id);
      if (old) old.remove();

      const el = doc.createElement("div");
      el.id = id;
      el.textContent = msg;
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.bottom = "14px";
      el.style.transform = "translateX(-50%)";
      el.style.zIndex = "2147483647";
      el.style.background = "rgba(0,0,0,0.78)";
      el.style.color = "#fff";
      el.style.padding = "10px 12px";
      el.style.borderRadius = "8px";
      el.style.font = "13px Arial";
      el.style.pointerEvents = "none";
      doc.documentElement.appendChild(el);

      setTimeout(() => el.remove(), 3200);
    } catch (_) {}
  }

  function run() {
    try {
      // mantiene l’azione “utente” nel top contesto per download
      try { getTopWin().focus?.(); } catch (_) {}

      const chatDoc = getChatDoc();
      if (!chatDoc?.body) {
        toast("SalvaChat: frame chat non trovato");
        debugLog("[salva_chat] frame chat non trovato");
        return;
      }

      const { nome, luogo } = getPgInfo();

      let chatHtml = chatDoc.body.innerHTML || "";
      chatHtml = decodeOldQuotes(chatHtml);

      const d = new Date();
      const dataHuman = formatHumanDate(d);

      const outHtml = buildHtmlDocument({
        nome,
        luogo,
        chatHtml,
        dataHuman
      });

      const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
      const file = `${makeFileSafeName(nome)} - ${makeFileSafeName(luogo)} - ${stamp}.html`;

      const ok = downloadHtml(file, outHtml);
      if (ok) {
        toast("Chat salvata: download avviato");
        debugLog("[salva_chat] download:", file);
      } else {
        toast("SalvaChat: impossibile avviare download");
        debugLog("[salva_chat] download failed");
      }
    } catch (e) {
      console.error("[salva_chat] errore:", e);
      toast("SalvaChat: errore (vedi console)");
    }
  }

  w.ExtremePlug.features.salvaChat = { run };

  debugLog("[salva_chat] loaded (download-only)");
})(window);
