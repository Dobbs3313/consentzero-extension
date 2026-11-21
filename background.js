const DEFAULT_SETTINGS = {
  enabled: true,
  policy: "reject", // "reject" | "hide"
  declutterOverlays: false,
  pausedHosts: [],
  customSelectors: []
};

chrome.runtime.onInstalled.addListener(async () => {
  const { cz_settings } = await chrome.storage.local.get("cz_settings");
  if (!cz_settings) await chrome.storage.local.set({ cz_settings: DEFAULT_SETTINGS });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "CONSENTZERO_REPORT") {
    (async () => {
      const { cz_stats = { totalHandled: 0, rejected: 0, hidden: 0 }, cz_log = [] } =
        await chrome.storage.local.get(["cz_stats", "cz_log"]);

      cz_stats.totalHandled = (cz_stats.totalHandled || 0) + 1;
      if (msg.action === "rejected") cz_stats.rejected = (cz_stats.rejected || 0) + 1;
      else cz_stats.hidden = (cz_stats.hidden || 0) + 1;

      const entry = {
        at: Date.now(),
        host: msg.host || "",
        action: msg.action,
        detail: msg.detail || ""
      };
      await chrome.storage.local.set({
        cz_stats,
        cz_log: [entry, ...cz_log].slice(0, 40)
      });

      if (sender.tab?.id) {
        chrome.action.setBadgeText({ tabId: sender.tab.id, text: "✓" });
        chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: "#0d9488" });
      }
      sendResponse({ ok: true });
    })();
    return true;
  }
});
