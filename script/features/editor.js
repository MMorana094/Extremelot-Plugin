// features/editor.js  (FRAME-SAFE + UI + CONTACARATTERI + OPACITY SLIDER + CLOSE)
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  w.ExtremePlug.editor = w.ExtremePlug.editor || {};

  const MAXLEN = 2000;

  // =========================
  // Target document (frame-safe)
  // =========================
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

  // =========================
  // Styles
  // =========================
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
        cursor: move; /* drag da tutto il pannello (ma vedi draggable cancel/handle) */
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
        cursor:text; /* non trascinare quando scrivi */
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
        align-items:center;
      }

      #divinfinestra button{
        padding:6px 12px;
        border:1px solid #aaa;
        border-radius:6px;
        background:#fff;
        cursor:pointer;
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

      /* ===== OPACITY SLIDER (solo per l'editor) ===== */
      #divinfinestra .ep-opacity-wrap{
        display:flex;
        align-items:center;
        gap:6px;
      }
      #divinfinestra .ep-opacity-label{
        font-size:12px;
        color:#444;
        white-space:nowrap;
      }
      #divinfinestra input.ep-opacity{
        width:110px;
        height:12px;
        cursor:pointer;
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
        display: none !important; /* chiusura gestita dal bottone "Chiudi" */
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
        background: rgba(0,0,0,0.04);
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:8px;
        padding:0 8px;
        box-sizing:border-box;
      }
      #divinfinestra .ep-dragbar:hover{
        background: rgba(0,0,0,0.07);
      }
    `;
    doc.head.appendChild(st);
  }

  // =========================
  // Character counter
  // =========================
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
      updateCounter(doc);
    });

    updateCounter(doc);
  }

  function ccc() {
    const doc = getTargetDoc();
    const $ = get$ForDoc(doc);
    if ($) bindCharCounter(doc, $);
  }

  // =========================
  // Close editor
  // =========================
  function closeEditor(doc, $) {
    const $dlg = $(doc).find("#divinfinestra");
    if (!$dlg.length) return;

    if (typeof $dlg.dialog === "function") {
      try { $dlg.dialog("close"); } catch (_) {}
    } else {
      $dlg.remove();
    }
  }

  // =========================
  // Opacity handling
  // - Applica opacità al "widget" jQuery UI (wrapper) se presente
  // - Fallback: applica opacità al pannello
  // =========================
  function applyOpacity(doc, $, value) {
    const v = Number(value);
    const op = Math.max(0.2, Math.min(1, (isFinite(v) ? v : 100) / 100));

    try {
      const $dlg = $(doc).find("#divinfinestra");
      if (!$dlg.length) return;

      // Se è un dialog jQuery UI: opacità sul wrapper (finestra intera)
      if (typeof $dlg.dialog === "function") {
        const $widget = $dlg.dialog("widget");
        if ($widget?.length) {
          $widget.css("opacity", op);
          return;
        }
      }

      // Fallback (no dialog): opacità sul pannello
      $dlg.css("opacity", op);
    } catch (_) {}
  }

  // =========================
  // Open editor
  // =========================
  function apriEditor() {
    const doc = getTargetDoc();
    const $ = get$ForDoc(doc);
    if (!$ || !doc?.body) return;

    ensureEditorStyle(doc);

    // Cleanup: rimuovi eventuale editor precedente
    try {
      const $old = $(doc).find("#divinfinestra");
      if ($old.length && typeof $old.dialog === "function") {
        try { $old.dialog("destroy"); } catch (_) {}
      }
      $old.remove();
    } catch (_) {}

    // UI
    const html = `
      <div id="divinfinestra">
        <div class="intedit">
          <div class="ep-dragbar" title="Trascina per spostare">
            <div class="ep-opacity-wrap" title="Opacità finestra">
              <span class="ep-opacity-label">Opacity</span>
              <input class="ep-opacity" type="range" min="20" max="100" value="100" />
            </div>
          </div>

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

    // Slider: aggiorna opacità (di default 100%)
    $(doc).find("#divinfinestra .ep-opacity")
      .off(".epOpacity")
      .on("input.epOpacity change.epOpacity", function (e) {
        // evita drag mentre usi lo slider
        try { e.stopPropagation(); } catch (_) {}
        applyOpacity(doc, $, this.value);
      })
      .on("mousedown.epOpacity pointerdown.epOpacity", function (e) {
        try { e.stopPropagation(); } catch (_) {}
      });

    if (typeof $dlg.dialog === "function") {
      $dlg.dialog({
        title: "",
        width: 640,
        height: 380,
        minWidth: 550,
        minHeight: 280,
        resizable: true,
        position: { my: "center", at: "center", of: doc.defaultView || w.window },
        open: function () {
          ccc();
          updateCounter(doc);

          // Applica opacità iniziale
          const v = $(doc).find("#divinfinestra .ep-opacity").val() || 100;
          applyOpacity(doc, $, v);
        },
        close: function () {
          try { $(this).dialog("destroy"); } catch (_) {}
          $(this).remove();
        }
      });

      // Trascina dalla dragbar interna
      try {
        const $widget = $dlg.dialog("widget");
        if ($widget && typeof $widget.draggable === "function") {
          $widget.draggable("option", {
            handle: ".ep-dragbar",
            cancel: "textarea, button, input, select, option"
          });
        }
      } catch (_) {}

      // dialogExtend (se presente)
      try {
        if ($.fn && $.fn.dialogExtend) {
          $dlg.dialogExtend({ maximizable: true, minimizable: true });
        }
      } catch (_) {}
    } else {
      // Fallback se non c'è jQuery UI dialog
      $dlg.css({ position: "fixed", top: "80px", right: "40px", zIndex: 9999999 });
      ccc();
      updateCounter(doc);

      // Applica opacità iniziale
      const v = $(doc).find("#divinfinestra .ep-opacity").val() || 100;
      applyOpacity(doc, $, v);
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
