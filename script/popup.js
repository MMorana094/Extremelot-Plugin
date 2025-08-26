const checkbox = document.getElementById("debugToggle");

// Carica stato salvato
chrome.storage.local.get("DEBUG_MODE", (data) => {
  checkbox.checked = Boolean(data.DEBUG_MODE);
});

// Salva stato quando cambi
checkbox.addEventListener("change", () => {
  chrome.storage.local.set({ DEBUG_MODE: checkbox.checked });
});