// core/debug.js
(function (w) {
  w.ExtremePlug = w.ExtremePlug || {};

  let DEBUG_MODE = false;

  // Se null => nessun filtro (logga tutto quando DEBUG_MODE=true)
  // Se Set => logga solo i componenti presenti
  let DEBUG_COMPONENTS_SET = null;

  // Normalizza chiavi (POSTA, scheda, "Scheda" -> "SCHEDA")
  function normComponent(x) {
    return String(x || "").trim().toUpperCase();
  }

  // Estrae il componente dal primo argomento se è del tipo "[POSTA][viewer] ..."
  // Ritorna "POSTA" oppure null (se non riconosciuto)
  function extractComponentFromArgs(args) {
    try {
      const first = args && args.length ? args[0] : null;
      if (typeof first !== "string") return null;

      // Match del primo bracket: [POSTA] ...
      const m = first.match(/^\s*\[([A-Za-z0-9_\-]+)\]/);
      if (m && m[1]) return normComponent(m[1]);
    } catch (_) {}
    return null;
  }

  function isComponentEnabled(comp) {
    // Nessun filtro => tutto abilitato
    if (!DEBUG_COMPONENTS_SET) return true;
    if (!comp) return false; // se filtro attivo e non riesco a capire il comp, non loggo
    return DEBUG_COMPONENTS_SET.has(normComponent(comp));
  }

  function applyComponentsFilter(value) {
    // value può essere:
    // - undefined/null => nessun filtro
    // - string => "POSTA" o "POSTA,SCHEDA"
    // - array => ["POSTA","SCHEDA"]
    // - object map => { POSTA: true, SCHEDA: false }
    try {
      if (value == null) {
        DEBUG_COMPONENTS_SET = null;
        return;
      }

      // stringa: "POSTA,SCHEDA"
      if (typeof value === "string") {
        const parts = value.split(",").map(normComponent).filter(Boolean);
        DEBUG_COMPONENTS_SET = parts.length ? new Set(parts) : null;
        return;
      }

      // array: ["POSTA","SCHEDA"]
      if (Array.isArray(value)) {
        const parts = value.map(normComponent).filter(Boolean);
        DEBUG_COMPONENTS_SET = parts.length ? new Set(parts) : null;
        return;
      }

      // oggetto: { POSTA: true, SCHEDA: false }
      if (typeof value === "object") {
        const parts = Object.keys(value).filter((k) => !!value[k]).map(normComponent);
        DEBUG_COMPONENTS_SET = parts.length ? new Set(parts) : null;
        return;
      }

      // fallback
      DEBUG_COMPONENTS_SET = null;
    } catch (_) {
      DEBUG_COMPONENTS_SET = null;
    }
  }

  function debugLog() {
    if (!DEBUG_MODE) return;

    try {
      const args = Array.prototype.slice.call(arguments);

      const comp = extractComponentFromArgs(args);
      if (!isComponentEnabled(comp)) return;

      console.log.apply(console, ["[DEBUG]"].concat(args));
    } catch (_) {}
  }

  function initDebugMode() {
    try {
      if (w.chrome && chrome.storage && chrome.storage.local) {
        // Caricamento iniziale
        chrome.storage.local.get(["DEBUG_MODE", "DEBUG_COMPONENTS"], (data) => {
          DEBUG_MODE = Boolean(data && data.DEBUG_MODE);
          applyComponentsFilter(data && data.DEBUG_COMPONENTS);

          // Nota: questo log passa dal filtro: se vuoi che passi sempre, mettilo senza [COMP]
          debugLog("[DEBUG][core] DEBUG_MODE iniziale:", DEBUG_MODE);
          debugLog("[DEBUG][core] DEBUG_COMPONENTS iniziale:", data && data.DEBUG_COMPONENTS);
        });

        // Aggiornamenti live
        chrome.storage.onChanged.addListener((changes) => {
          try {
            if (changes && changes.DEBUG_MODE) {
              DEBUG_MODE = Boolean(changes.DEBUG_MODE.newValue);
              debugLog("[DEBUG][core] DEBUG_MODE aggiornato:", DEBUG_MODE);
            }
            if (changes && changes.DEBUG_COMPONENTS) {
              applyComponentsFilter(changes.DEBUG_COMPONENTS.newValue);
              debugLog("[DEBUG][core] DEBUG_COMPONENTS aggiornato:", changes.DEBUG_COMPONENTS.newValue);
            }
          } catch (_) {}
        });
      }
    } catch (e) {
      // qui lascio warn perché è debug core; ma se vuoi 100% no-console, lo rimuovo
      try { console.warn("DEBUG init error:", e); } catch (_) {}
    }
  }

  w.ExtremePlug.debug = {
    initDebugMode,
    debugLog,

    // Log diagnostica standard di bootstrap (utile su frameset/all_frames)
    bootCheck(tag, extra) {
      try {
        debugLog(
          tag || "bootCheck",
          Object.assign(
            {
              href: (w.location && w.location.href) || "",
              isTop: w.top === w,
              hasFrameset: !!w.document.querySelector("frameset"),
              hasResultFrame: !!w.document.querySelector("frame[name='result']"),
              readyState: w.document && w.document.readyState,
            },
            extra || {}
          )
        );
      } catch (_) {}
    },

    // API comoda per leggere/impostare il filtro a runtime
    get enabled() { return DEBUG_MODE; },
    set enabled(v) { DEBUG_MODE = Boolean(v); },

    get components() {
      try { return DEBUG_COMPONENTS_SET ? Array.from(DEBUG_COMPONENTS_SET) : null; } catch (_) { return null; }
    },
    set components(v) {
      applyComponentsFilter(v);
      try {
        if (w.chrome?.storage?.local) {
          chrome.storage.local.set({ DEBUG_COMPONENTS: v });
        }
      } catch (_) {}
    },

    // helper: abilita/disabilita un singolo componente (persistente)
    setComponent(name, on) {
      const key = normComponent(name);
      const current = DEBUG_COMPONENTS_SET ? new Set(DEBUG_COMPONENTS_SET) : new Set();
      if (on) current.add(key);
      else current.delete(key);

      const arr = Array.from(current);
      applyComponentsFilter(arr.length ? arr : null);

      try {
        if (w.chrome?.storage?.local) {
          chrome.storage.local.set({ DEBUG_COMPONENTS: arr.length ? arr : null });
        }
      } catch (_) {}
    },
  };
})(window);
