// ui/dialogs.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  function openIframeDialog(opts) {
    const id = opts.id;
    const title = opts.title || '';
    const url = opts.url;

    w.jQuery('#' + id).remove();
    const $c = w.jQuery('<div>', { id: id }).appendTo('body');
    if (opts.html) {
      $c.html(opts.html);
    } else {
      const $if = w.jQuery('<iframe>', {
        src: url,
        width: '100%',
        height: '100%',
        frameborder: 0
      });
      $c.append($if);
    }

    const d = w.jQuery('#' + id).dialog({
      title: title,
      resizable: true,
      draggable: true,
      position: opts.position || { my: 'center', at: 'center', of: w.window },
      minHeight: opts.minHeight || 400,
      minWidth: opts.minWidth || 600,
      height: opts.height || 550,
      width: opts.width || 950,
      modal: Boolean(opts.modal),
      close: function () { w.jQuery(this).dialog('destroy').remove(); }
    });

    return d;
  }

  function toggleDialog(id) {
    const $d = w.jQuery('#' + id);
    if ($d.length && $d.dialog('isOpen')) {
      $d.dialog('close');
      return false;
    }
    $d.dialog('open');
    return true;
  }

  w.ExtremePlug.dialogs = {
    openIframeDialog,
    toggleDialog
  };
})(window);
