// script/popup.js
(function () {
  const checkbox = document.getElementById("debugToggle");
  if (!checkbox) return;

  function setChecked(v) {
    checkbox.checked = !!v;
  }

  try {
    chrome.storage.local.get("DEBUG_MODE", (data) => {
      setChecked(data && data.DEBUG_MODE);
    });

    checkbox.addEventListener("change", () => {
      chrome.storage.local.set({ DEBUG_MODE: checkbox.checked });
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes && changes.DEBUG_MODE) setChecked(changes.DEBUG_MODE.newValue);
    });
  } catch (e) {
    console.warn("popup debug toggle error:", e);
  }
})();
