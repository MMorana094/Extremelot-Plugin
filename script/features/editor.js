// features/editor.js  (FRAME-SAFE + UI + CONTACARATTERI + CLOSE)
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.editor = w.ExtremePlug.editor || {};

  const MAXLEN = 2000;

  function getTargetDoc() {
    const d = w.ExtremePlug?.menu?._lastTargetDoc;
    if (d?.body) return d;
    const resultDoc = w.top?.result?.document;
    if (resultDoc?.body) return resultDoc;
    return w.document;
  }

  function get$ForDoc(doc) {
    try {
      const win = doc?.defaultView;
      return win?.jQuery || w.top?.jQuery || w.jQuery || null;
    } catch (_) {
      return w.top?.jQuery || w.jQuery || null;
    }
  }

  function ensureEditorStyle(doc) {
    if (!doc?.head || doc.getElementById("extremeplug-editor-style")) return;

    const st = doc.createElement("style");
    st.id = "extremeplug-editor-style";
    st.textContent = `
      /* --- Pannello editor --- */
      #divinfinestra .intedit{
        background:#f6f6f6;
        border:1px solid #cfcfcf;
        border-radius:10px;
        padding:10px;
        box-shadow:0 1px 4px rgba(0,0,0,.12);
        cursor: move; /* drag da tutto il pannello */
      }

      #divinfinestra #mioeditorino{
        width:100%;
        height:210px;
        resize:vertical;
        padding:8px;
        border:1px solid #bbb;
        border-radius:6px;
        font-family:Arial,sans-serif;
        font-size:14px;
        box-sizing:border-box;
        background:#fff;
        cursor: text; /* non trascinare quando scrivi */
      }

      #divinfinestra .ep-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-top:8px;
      }

      #divinfinestra .ep-actions{
        display:flex;
        gap:6px;
      }

      #divinfinestra button{
        padding:6px 12px;
        border:1px solid #aaa;
        border-radius:6px;
        background:#fff;
        cursor:pointer; /* bottoni cliccabili, non drag */
      }
      #divinfinestra button:hover{ background:#f0f0f0; }

      #divinfinestra #contacaratteri{
        font-size:12px;
        padding:2px 8px;
        border:1px solid #ddd;
        border-radius:999px;
        background:#fff;
        white-space:nowrap;
        cursor: default;
      }

      /* --- jQuery UI dialog: wrapper neutro (no bordo/no ombra/no padding) --- */
      .ui-dialog:has(#divinfinestra){
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
      }

      .ui-dialog:has(#divinfinestra) .ui-dialog-titlebar{
        background: transparent !important;
        border: 0 !important;
        margin: 0 !important;
        padding: 0 !important; /* niente fascia */
      }

      .ui-dialog:has(#divinfinestra) .ui-dialog-title{
        font-size: 0 !important;
        line-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .ui-dialog:has(#divinfinestra) .ui-dialog-titlebar-close{
        display: none !important;
      }

      .ui-dialog:has(#divinfinestra) .ui-dialog-content{
        background: transparent !important;
        border: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .ui-dialog:has(#divinfinestra) #divinfinestra{
        padding: 0 !important;
        margin: 0 !important;
      }
        /* Drag bar interna: sempre “prendibile” */
      #divinfinestra .ep-dragbar{
        height: 18px;
        margin: -10px -10px 8px -10px; /* si allinea al padding della card */
        border-radius: 10px 10px 0 0;
        cursor: move;
        background: rgba(0,0,0,0.04);  /* leggerissima, puoi anche metterla transparent */
      }
      #divinfinestra .ep-dragbar:hover{
        background: rgba(0,0,0,0.07);
      }

    `;
    doc.head.appendChild(st);
  }

  function updateCounter(doc) {
    const ta = doc.getElementById("mioeditorino");
    const cc = doc.getElementById("contacaratteri");
    if (!ta || !cc) return;
    cc.textContent = `${ta.value.length}/${MAXLEN}`;
  }

  function bindCharCounter(doc, $) {
    const $ta = $(doc).find("#mioeditorino");
    if (!$ta.length) return;

    $ta.off(".charcount").on("input.charcount keyup.charcount focus.charcount blur.charcount", function () {
      try { w.contacara && w.contacara(); } catch (_) {}
      updateCounter(doc);
    });

    updateCounter(doc);
  }

  function ccc() {
    const doc = getTargetDoc();
    const $ = get$ForDoc(doc);
    if ($) bindCharCounter(doc, $);
  }

  function closeEditor(doc, $) {
    const $dlg = $(doc).find("#divinfinestra");
    if (!$dlg.length) return;

    if (typeof $dlg.dialog === "function") {
      try { $dlg.dialog("close"); } catch (_) {}
    } else {
      $dlg.remove();
    }
  }

  function apriEditor() {
    const doc = getTargetDoc();
    const $ = get$ForDoc(doc);
    if (!$ || !doc?.body) return;

    ensureEditorStyle(doc);

    // cleanup
    try {
      const $old = $(doc).find("#divinfinestra");
      if ($old.length && typeof $old.dialog === "function") {
        try { $old.dialog("destroy"); } catch (_) {}
      }
      $old.remove();
    } catch (_) {}

    const html = `
      <div id="divinfinestra">
        <div class="intedit">
          <div class="ep-dragbar" title="Trascina per spostare"></div>
          <textarea id="mioeditorino" placeholder="Scrivi la tua azione" maxlength="${MAXLEN}"></textarea>
          <div class="ep-row">
            <div class="ep-actions">
              <button id="button" type="button">Copia</button>
              <button id="close_editor" type="button">Chiudi</button>
            </div>
            <div id="contacaratteri">0/${MAXLEN}</div>
          </div>
        </div>
      </div>
    `;

    $(doc.body).append(html);
    const $dlg = $(doc).find("#divinfinestra");

    if (typeof $dlg.dialog === "function") {
      $dlg.dialog({
        title: "",
        width: 640,
        height: 380,
        minWidth: 550,
        minHeight: 280,
        resizable: true,
        position: { my: "center", at: "center", of: doc.defaultView || w.window },
        open: function () { ccc(); updateCounter(doc); },
        close: function () {
          try { $(this).dialog("destroy"); } catch (_) {}
          $(this).remove();
        }
      });

      // ✅ TRASCINA DA TUTTO IL PANNELLO (.intedit)
      try {
        const $widget = $dlg.dialog("widget");
        if ($widget && typeof $widget.draggable === "function") {
          // handle = dragbar interna, cancel = non trascinare su input e bottoni
          $widget.draggable("option", {
            handle: ".ep-dragbar",
            cancel: "textarea, button, input, select, option"
          });
        }
      } catch (_) {}


      // dialogExtend
      try {
        if ($.fn && $.fn.dialogExtend) {
          $dlg.dialogExtend({ maximizable: true, minimizable: true });
        }
      } catch (_) {}
    } else {
      $dlg.css({ position: "fixed", top: "80px", right: "40px", zIndex: 9999999 });
      ccc();
      updateCounter(doc);
    }

    // Copia (nel tuo storico era CUT)
    $(doc).find("#button").off("click.editor").on("click.editor", function () {
      const ta = doc.getElementById("mioeditorino");
      if (!ta) return;
      ta.focus();
      ta.select();
      try { doc.execCommand("cut"); } catch (_) {}
      updateCounter(doc);
    });

    // Close
    $(doc).find("#close_editor").off("click.editor").on("click.editor", function () {
      closeEditor(doc, $);
    });
  }

  // API legacy + SRP
  w.ccc = ccc;
  w.apriEditor = apriEditor;
  w.ExtremePlug.editor.apriEditor = apriEditor;
  w.ExtremePlug.editor.apri = apriEditor;

})(window);
