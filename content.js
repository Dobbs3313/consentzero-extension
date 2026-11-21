(() => {
  const SAFE_SKIP_CONTAINER = /intercom|zendesk|crisp|drift|hubspot|livechat|chat-widget|tawk|freshchat/i;

  // High-precision CMP Reject / Necessary-Only selectors (ordered safest -> broadest)
  const REJECT_SELECTORS = [
    "#onetrust-reject-all-handler",
    "#CybotCookiebotDialogBodyButtonDecline",
    "#didomi-notice-disagree-button",
    "button[data-testid='uc-deny-all-button']",
    "button[data-cky-tag='reject-button']",
    "button.cky-btn-reject",
    ".qc-cmp2-summary-buttons button[mode='secondary']",
    "#truste-consent-required",
    ".osano-cm-denyAll",
    ".cc-deny",
    "button[id*='reject-all' i]",
    "button[id*='decline-all' i]",
    "button[class*='reject-all' i]",
    "button[aria-label*='reject all' i]",
    "button[aria-label*='necessary only' i]"
  ];

  const BANNER_CONTAINER_SELECTORS = [
    "#onetrust-banner-sdk",
    "#CybotCookiebotDialog",
    "#didomi-host",
    "#usercentrics-root",
    ".cky-consent-container",
    ".qc-cmp2-container",
    ".osano-cm-window",
    "[id*='cookie-banner' i]",
    "[id*='cookie-consent' i]",
    "[class*='cookie-banner' i]",
    "[class*='cookie-consent' i]",
    "[role='dialog'][aria-label*='cookie' i]"
  ];

  const REJECT_TEXT_RE = /^(reject all|decline all|deny all|refuse all|only necessary|necessary only|essential only|reject non-essential|continue without accepting|save & exit|disagree)$/i;

  let handled = false;
  let observer = null;

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
  }

  function isSafeElement(el) {
    let cur = el;
    for (let i = 0; i < 6 && cur; i++, cur = cur.parentElement) {
      const idCls = `${cur.id || ""} ${typeof cur.className === "string" ? cur.className : ""}`;
      if (SAFE_SKIP_CONTAINER.test(idCls)) return false;
    }
    return true;
  }

  function report(action, detail) {
    handled = true;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    chrome.runtime.sendMessage({
      type: "CONSENTZERO_REPORT",
      host: location.hostname,
      action,
      detail
    }).catch(() => {});
  }

  function scanAndHandle(settings) {
    if (handled || !settings?.enabled) return;

    // 1. Custom Pro selectors first
    for (const sel of settings.customSelectors || []) {
      try {
        const el = document.querySelector(sel);
        if (el && isVisible(el) && isSafeElement(el)) {
          if (el.tagName === "BUTTON" || el.tagName === "A") {
            el.click();
            report("rejected", `Custom click: ${sel}`);
          } else {
            el.style.setProperty("display", "none", "important");
            report("hidden", `Custom hide: ${sel}`);
          }
          return;
        }
      } catch {
        // invalid custom selector
      }
    }

    // 2. Known CMP Reject buttons
    if (settings.policy !== "hide") {
      for (const sel of REJECT_SELECTORS) {
        const btn = document.querySelector(sel);
        if (btn && isVisible(btn) && isSafeElement(btn)) {
          btn.click();
          report("rejected", `Clicked ${sel}`);
          return;
        }
      }

      // 3. Heuristic Reject button inside cookie-related container
      for (const cSel of BANNER_CONTAINER_SELECTORS) {
        const container = document.querySelector(cSel);
        if (!container || !isVisible(container) || !isSafeElement(container)) continue;
        const buttons = container.querySelectorAll("button, a[role='button'], input[type='button']");
        for (const btn of buttons) {
          const label = (btn.textContent || btn.value || btn.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
          if (REJECT_TEXT_RE.test(label) && isVisible(btn)) {
            btn.click();
            report("rejected", `Clicked "${label}"`);
            return;
          }
        }
      }
    }

    // 4. Fallback: safely hide pure cookie banner container without touching chat widgets
    for (const cSel of BANNER_CONTAINER_SELECTORS) {
      const container = document.querySelector(cSel);
      if (container && isVisible(container) && isSafeElement(container)) {
        container.style.setProperty("display", "none", "important");
        document.documentElement.style.removeProperty("overflow");
        document.body && document.body.style.removeProperty("overflow");
        report("hidden", `Safely hid ${cSel}`);
        return;
      }
    }
  }

  chrome.storage.local.get("cz_settings", ({ cz_settings }) => {
    const settings = cz_settings || { enabled: true, policy: "reject", pausedHosts: [], customSelectors: [] };
    if (!settings.enabled) return;
    if ((settings.pausedHosts || []).includes(location.hostname)) return;

    scanAndHandle(settings);
    if (handled) return;

    // Short-lived observer (auto-stops at 8s so idle CPU is literally 0%)
    observer = new MutationObserver(() => scanAndHandle(settings));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }, 8000);
  });
})();
