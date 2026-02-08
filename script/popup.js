// script/popup.js
(function () {
  const checkbox = document.getElementById("debugToggle");
  if (!checkbox) return;

  // mini logger (non usare console.warn/error)
  function debugLog() {
    try {
      const args = Array.prototype.slice.call(arguments);
      // in popup è ok loggare solo quando serve: qui lo teniamo sempre silenzioso
      // (se vuoi, abilitalo solo quando checkbox.checked)
      // console.log("[popup]", ...args);
    } catch (_) {}
  }

  function setChecked(v) {
    checkbox.checked = !!v;
  }

  // ---------- UI: box Install ID (creato al volo) ----------
  function ensureInstallBox() {
    let box = document.getElementById("ep-install-box");
    if (box) return box;

    box = document.createElement("div");
    box.id = "ep-install-box";
    box.style.marginTop = "10px";
    box.style.padding = "8px";
    box.style.border = "1px solid rgba(255,255,255,0.2)";
    box.style.borderRadius = "8px";
    box.style.display = "none";

    const title = document.createElement("div");
    title.textContent = "Debug • Install ID";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "6px";
    row.style.alignItems = "center";

    const input = document.createElement("input");
    input.id = "ep-install-id";
    input.type = "text";
    input.readOnly = true;
    input.placeholder = "Caricamento...";
    input.style.flex = "1";
    input.style.width = "100%";
    input.style.padding = "6px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid rgba(255,255,255,0.2)";
    input.style.background = "rgba(0,0,0,0.15)";
    input.style.color = "inherit";

    const btn = document.createElement("button");
    btn.id = "ep-copy-install-id";
    btn.type = "button";
    btn.textContent = "Copia";
    btn.style.padding = "6px 10px";
    btn.style.borderRadius = "6px";
    btn.style.border = "1px solid rgba(255,255,255,0.25)";
    btn.style.background = "rgba(255,255,255,0.08)";
    btn.style.color = "inherit";
    btn.style.cursor = "pointer";

    row.appendChild(input);
    row.appendChild(btn);

    const meta = document.createElement("div");
    meta.id = "ep-install-meta";
    meta.style.marginTop = "6px";
    meta.style.fontSize = "12px";
    meta.style.opacity = "0.9";
    meta.textContent = "";

    const hint = document.createElement("div");
    hint.style.marginTop = "6px";
    hint.style.fontSize = "12px";
    hint.style.opacity = "0.8";
    hint.textContent =
      "In caso di problemi: copia e incolla questo ID in chat (ti serve per trovare l’installazione nei log).";

    box.appendChild(title);
    box.appendChild(row);
    box.appendChild(meta);
    box.appendChild(hint);

    // inserisci subito sotto il blocco checkbox
    const host = checkbox.closest("div") || checkbox.parentElement || document.body;
    host.appendChild(box);

    // copy handler
    btn.addEventListener("click", async () => {
      try {
        const v = String(input.value || "").trim();
        if (!v) return;

        // Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(v);
          btn.textContent = "Copiato!";
          setTimeout(() => (btn.textContent = "Copia"), 900);
          return;
        }

        // fallback
        input.focus();
        input.select();
        const ok = document.execCommand && document.execCommand("copy");
        if (ok) {
          btn.textContent = "Copiato!";
          setTimeout(() => (btn.textContent = "Copia"), 900);
        }
      } catch (_) {}
    });

    return box;
  }

  function setInstallBoxVisible(visible) {
    const box = ensureInstallBox();
    box.style.display = visible ? "block" : "none";
  }

  function fmtLine(label, value) {
    if (!value) return "";
    return `${label}: ${value}`;
  }

  function refreshInstallInfo() {
    const box = ensureInstallBox();
    const input = document.getElementById("ep-install-id");
    const meta = document.getElementById("ep-install-meta");
    if (!input || !meta) return;

    input.value = "";
    input.placeholder = "Caricamento...";

    try {
      chrome.runtime.sendMessage({ type: "EP_GET_INSTALL_INFO" }, (resp) => {
        if (chrome.runtime.lastError) {
          input.placeholder = "Errore (runtime)";
          meta.textContent = "";
          return;
        }
        if (!resp || !resp.ok) {
          input.placeholder = "Errore (no data)";
          meta.textContent = resp?.error ? String(resp.error) : "";
          return;
        }

        input.value = resp.installId || "";
        const lines = [
          fmtLine("Versione", resp.version),
          fmtLine("Creato", resp.created),
          fmtLine("Last heartbeat", resp.lastHeartbeat)
        ].filter(Boolean);

        meta.textContent = lines.join(" • ");
      });
    } catch (_) {
      input.placeholder = "Errore (exception)";
      meta.textContent = "";
    }
  }

  // ---------- storage wiring ----------
  try {
    chrome.storage.local.get("DEBUG_MODE", (data) => {
      const enabled = !!(data && data.DEBUG_MODE);
      setChecked(enabled);
      setInstallBoxVisible(enabled);
      if (enabled) refreshInstallInfo();
    });

    checkbox.addEventListener("change", () => {
      const enabled = checkbox.checked;
      chrome.storage.local.set({ DEBUG_MODE: enabled }, () => {
        // UI immediata
        setInstallBoxVisible(enabled);
        if (enabled) refreshInstallInfo();
      });
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes && changes.DEBUG_MODE) {
        const enabled = !!changes.DEBUG_MODE.newValue;
        setChecked(enabled);
        setInstallBoxVisible(enabled);
        if (enabled) refreshInstallInfo();
      }
    });
  } catch (_) {
    // volutamente silenzioso
    debugLog("popup error");
  }
})();
