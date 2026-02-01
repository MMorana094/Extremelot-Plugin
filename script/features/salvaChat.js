// features/salvaChat.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};
  const C = w.ExtremePlug.constants;
  const debugLog = w.ExtremePlug.debug.debugLog;

  function cleanupTemp() {
    w.jQuery('#imieidati, #miachattina, #linksalva').remove();
  }

  function getChatHtml() {
    try {
      const resultFrame = w.top.frames['result'];
      if (!resultFrame || !resultFrame.document) return '';

      // dentro result c'è un frame testo
      const testoFrameEl = w.jQuery("frame[name='testo']", resultFrame.document)[0];
      if (!testoFrameEl || !testoFrameEl.contentDocument) return '';

      const $body = w.jQuery('body', testoFrameEl.contentDocument);
      let info = $body.html() || '';
      // compatibilità con vecchia sostituzione
      info = info.replace(/\&gt;/g, "»</i>").replace(/\&lt;/g, '<i>«');
      return info;
    } catch (e) {
      debugLog('getChatHtml error:', e);
      return '';
    }
  }

  function buildHiddenForm(pgNome, luogo, chatHtml) {
    w.jQuery('#miachattina').remove();

    const $wrap = w.jQuery('<div>', { id: 'miachattina', style: 'display:none;' }).appendTo('body');
    const $form = w.jQuery('<form>', { id: 'salvataggio', name: 'salvataggio' }).appendTo($wrap);

    w.jQuery('<input>', { type: 'hidden', name: 'pg', id: 'pg', value: pgNome || '' }).appendTo($form);
    w.jQuery('<input>', { type: 'hidden', name: 'luogo', id: 'luogo', value: luogo || '' }).appendTo($form);
    w.jQuery('<textarea>', { id: 'chat', name: 'chat' }).val(chatHtml || '').appendTo($form);

    w.jQuery('<div>', { id: 'esito_salva' }).appendTo($wrap);
  }

  function postToServer() {
    const url = C.EXTREMEPLUG_ORIGIN + '/docs/plugin/salva_chat3.php';
    return w.jQuery.post(url, w.jQuery('#salvataggio').serialize());
  }

  function showConfirmationDialog() {
    w.jQuery('#esito_salva').dialog({
      title: 'Chat Salvata',
      resizable: true,
      position: { my: 'center top', at: 'center top', of: w.window },
      minHeight: 100,
      minWidth: 200,
      height: 150,
      width: 300,
      cache: false,
      open: function () {
        try { if (w.ccc) w.ccc(); } catch (_) {}
      },
      close: function () { w.jQuery(this).dialog('destroy').remove(); }
    });

    setTimeout(function () { w.jQuery('#esito_salva').remove(); }, 10000);
  }

  function salvaChat() {
    cleanupTemp();

    const dati = w.ExtremePlug.pgData.getPgData();
    if (!dati || !dati.nome) {
      w.alert('Impossibile recuperare i dati del PG');
      return;
    }

    const chat = getChatHtml();
    buildHiddenForm(dati.nome, dati.luogo, chat);

    postToServer().done(function (data) {
      w.jQuery('#esito_salva').html(data);
      showConfirmationDialog();
    });
  }

  // compatibilità
  w.salvaChat = salvaChat;
  w.ExtremePlug.salvaChat = { salvaChat: salvaChat };
})(window);
