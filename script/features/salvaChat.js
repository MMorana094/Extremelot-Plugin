// features/salvaChat.js
 
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.features = w.ExtremePlug.features || {};
 
  const debugLog = w.ExtremePlug?.debug?.debugLog || function () {};
 
  function getTopWin() {
    try { return w.top || w; }
    catch (_) { return w; }
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
 
  function getChatDoc() {
    const topWin = getTopWin();
    const topDoc = topWin.document;
    return getFrameDocByName("result", topDoc);
  }
 
  function countMessages(container) {
    try { return container.querySelectorAll(".chat-msg").length; }
    catch { return 0; }
  }
 
  function swapTagPos(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
 
    // Cicla tutti i messaggi
    const msgs = container.querySelectorAll(".chat-msg");
 
    msgs.forEach(msg => {
      const tags = msg.querySelectorAll(".msg-tag-pos");
 
      tags.forEach(tag => {
        const testo = tag.textContent.trim();
 
        // Controlla che il testo sia del tipo [qualcosa]
        if (testo.startsWith("[") && testo.endsWith("]")) {
          const contenuto = testo.slice(1, -1).trim();
 
          // Nuovo HTML
          const nuovoHTML = `<font size="1" color="#606060"><b>[${contenuto}]</b></font>`;
 
          // Sostituisci lo span originale
          tag.outerHTML = nuovoHTML;
        }
      });
    });
 
    return container.innerHTML;
  }
 
  // NOTA: converte SOLO i testi dopo .msg-tag-pos che usano (), [] o {}
  // in < >. Chi scrive già nativamente con < >, o direttamente con « »,
  // non viene toccato qui: è decodeOldQuotes (subito dopo, nella pipeline)
  // a occuparsi in modo UNIFORME di trasformare < >/&lt;&gt; in «...» e di
  // normalizzare eventuali « » già presenti, avvolgendo tutto in <i>...</i>
  // indipendentemente da come è stato scritto originariamente in chat.
  function convertActionBrackets(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
 
    const msgs = container.querySelectorAll(".chat-msg");
 
    msgs.forEach(msg => {
      const pos = msg.querySelector(".msg-tag-pos");
      if (!pos) return;
 
      let node = pos.nextSibling;
 
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = node.textContent
            .replace(/[\(\[\{]/g, "<")
            .replace(/[\)\]\}]/g, ">");
        }
        node = node.nextSibling;
      }
    });
 
    return container.innerHTML;
  }
 
  function getPgInfo() {
 
    const topWin = getTopWin();
    const topDoc = topWin.document;
    const logoDoc = getFrameDocByName("logo", topDoc);
 
    if (!logoDoc) return { nome:"Sconosciuto", luogo:"Luogo sconosciuto" };
 
    const nome = (logoDoc.querySelector("input[name='player']")?.value || "Sconosciuto").trim();
    let luogo = (logoDoc.querySelector("input[name='titolo']")?.value || "Luogo sconosciuto").trim();
 
    luogo = luogo.replace(/<\/?b>/gi,"").trim();
 
    return { nome, luogo };
  }
 
  // Avvolge in corsivo (<i>...</i>) le azioni, usando i caporali «»
  // tipografici. Gestisce in modo UNIFORME tre origini possibili dello
  // stesso simbolo, senza mai avvolgere due volte lo stesso guillemet:
  //  1) < > nativi digitati in chat (arrivano qui come entità &lt;/&gt;)
  //  2) ()[]{} convertiti in < > da convertActionBrackets (idem, entità)
  //  3) « » digitati DIRETTAMENTE dall'utente (non sono caratteri HTML
  //     riservati, quindi restano letterali nell'innerHTML e non passano
  //     mai dal passo 1/2)
  // Passo 1: converte le entità &lt;/&gt; in «...» avvolti in corsivo.
  // Passo 2 (difensivo): individua eventuali « » "nudi" (non ancora
  // avvolti dal passo 1, riconoscibili perché NON preceduti da <i> / NON
  // seguiti da </i>) e li avvolge a loro volta, così anche chi scrive
  // già nativamente con « » ottiene lo stesso corsivo uniforme.
  function decodeOldQuotes(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
 
    const msgs = container.querySelectorAll(".chat-msg");
 
    msgs.forEach(msg => {
      // Salta i messaggi del fato
      if (msg.querySelector(".msg-fato-box")) return;
 
      let out = String(msg.innerHTML || "")
        .replace(/\&gt;/g,"»</i>")
        .replace(/\&lt;/g,"<i>«");

      out = out
        .replace(/(?<!<i>)«/g, "<i>«")
        .replace(/»(?!<\/i>)/g, "»</i>");

      msg.innerHTML = out;
    });
 
    return container.innerHTML;
  }
 
  function stripScripts(html) {
    return String(html || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi,"");
  }
 
  function stripInlineEvents(html) {
    return String(html || "").replace(/\son\w+="[^"]*"/gi,"");
  }
 
  // De-linkificazione totale: trasforma ogni <a> in <span> non cliccabile.
  // Copre sia gli avatar/razza (<a href="javascript:..."><img></a>) sia i
  // link a schede oggetto dentro il testo delle azioni (<a href="https://...">
  // Collana</a>). Gli avatar mantengono l'immagine intatta senza stile
  // aggiuntivo (non è testo); i link testuali mantengono l'aspetto visivo
  // "link classico" (blu, sottolineato) pur non essendo più cliccabili.
  // Il nickname (<span onclick="...">) non è un <a>: il suo handler viene
  // già rimosso da stripInlineEvents, quindi non richiede trattamento qui.
  function removeLinks(html) {
    const container = document.createElement("div");
    container.innerHTML = html;

    container.querySelectorAll("a").forEach(a => {
      const span = document.createElement("span");
      const hasImg = !!a.querySelector("img");

      while (a.firstChild) span.appendChild(a.firstChild);

      if (!hasImg) {
        span.style.color = "#0000EE";
        span.style.textDecoration = "underline";
      }
      span.style.cursor = "default";

      a.replaceWith(span);
    });

    return container.innerHTML;
  }
 
  function makeFileSafeName(s) {
    return String(s||"")
      .replace(/[\\/:*?"<>|]+/g,"_")
      .replace(/\s+/g," ")
      .trim()
      .slice(0,80);
  }
 
  function pad2(n){
    n=String(n);
    return n.length===1?"0"+n:n;
  }
 
  function escapeHtml(s){
    return String(s ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }
 
  function formatHumanDate(d){
    const mesi=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
    return `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
  }
 
  function buildHtmlDocument({nome,luogo,chatHtml,dataHuman,count}){
 
    const d=new Date();
    const title=`[${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}] ${luogo} ${nome}`;
 
    return `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
 
<link rel="stylesheet" href="https://colossus.altervista.org/LOT/chat_taverne.css">
 
<style>
body{
background:#F8E9AA;
padding:10px;
}
i{color:#434343;}
.msg-nick{cursor:default;}
</style>
</head>
 
<body>
 
<div style="text-align:justify;margin:5px;">
 
<p style="font-size:18px;font-family:verdana;color:#808000;text-align:center;">
${escapeHtml(nome)} - ${escapeHtml(luogo)} - ${escapeHtml(dataHuman)}
</p>
 
<p style="text-align:center;font-family:verdana;font-size:12px;color:#444;">
Azioni salvate: <b>${count}</b>
</p>
 
<hr>
 
<font face="Verdana, Arial" size="2">
${chatHtml}
</font>
 
</div>
 
</body>
</html>`;
  }
 
  function downloadHtml(filename,text){
 
    const topWin=getTopWin();
    const doc=topWin.document;
 
    if(!doc.body) return false;
 
    const blob=new Blob([text],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
 
    const a=doc.createElement("a");
    a.href=url;
    a.download=filename;
    a.style.display="none";
 
    doc.body.appendChild(a);
    a.click();
 
    setTimeout(()=>{
      try{URL.revokeObjectURL(url);}catch(_){}
      try{a.remove();}catch(_){}
    },800);
 
    return true;
  }
 
  function toast(msg){
 
    try{
 
      const topWin=getTopWin();
      const doc=topWin.document;
 
      const el=doc.createElement("div");
 
      el.textContent=msg;
      el.style.position="fixed";
      el.style.left="50%";
      el.style.bottom="14px";
      el.style.transform="translateX(-50%)";
      el.style.zIndex="2147483647";
      el.style.background="rgba(0,0,0,0.78)";
      el.style.color="#fff";
      el.style.padding="10px 12px";
      el.style.borderRadius="8px";
      el.style.font="13px Arial";
 
      doc.documentElement.appendChild(el);
 
      setTimeout(()=>el.remove(),3200);
 
    }catch(_){}
  }
 
  function run(){
 
    try{
 
      const chatDoc=getChatDoc();
 
      if(!chatDoc?.body){
        toast("SalvaChat: frame chat non trovato");
        return;
      }
 
      const {nome,luogo}=getPgInfo();
      const msgBox=chatDoc.querySelector("#chat-messages");
 
      if(!msgBox){
        toast("SalvaChat: messaggi non trovati");
        return;
      }
 
      let chatHtml=msgBox.innerHTML;
 
      chatHtml=convertActionBrackets(chatHtml);
      chatHtml=decodeOldQuotes(chatHtml);
      chatHtml=stripScripts(chatHtml);
      chatHtml=stripInlineEvents(chatHtml);
      chatHtml=removeLinks(chatHtml);
      chatHtml=swapTagPos(chatHtml);
 
      const d=new Date();
      const dataHuman=formatHumanDate(d);
      const count=countMessages(msgBox);
 
      const outHtml=buildHtmlDocument({
        nome,
        luogo,
        chatHtml,
        dataHuman,
        count,
      });
 
      const stamp=`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
 
      const file=`${makeFileSafeName(nome)} - ${makeFileSafeName(luogo)} - ${stamp}.html`;
 
      const ok=downloadHtml(file,outHtml);
 
      if(ok) toast("Chat salvata");
 
    }catch(e){
      debugLog("[salva_chat] errore:",e);
      toast("SalvaChat errore");
    }
  }
 
  w.ExtremePlug.features.salvaChat={ run };
 
  debugLog("[salva_chat] loaded");
 
})(window);
