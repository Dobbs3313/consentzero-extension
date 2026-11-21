import { BillingManager } from "./lib/billing.js";
import { BILLING_CONFIG } from "./lib/billing-config.js";

const DEFAULT_SETTINGS = { enabled: true, policy: "reject", declutterOverlays: false, pausedHosts: [], customSelectors: [] };
const billing = new BillingManager(BILLING_CONFIG);
let settings = structuredClone(DEFAULT_SETTINGS);
let activeHost = "";
let toastTimer = null;

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${name}`));
}

async function save() {
  await chrome.storage.local.set({ cz_settings: settings });
  render();
}

async function render() {
  const pill = document.getElementById("tierPill");
  pill.textContent = billing.isPro() ? "PRO" : "FREE";
  pill.classList.toggle("pro", billing.isPro());

  document.getElementById("enabledToggle").checked = !!settings.enabled;
  document.getElementById("policySelect").value = settings.policy || "reject";
  document.getElementById("declutterToggle").checked = !!settings.declutterOverlays;

  const isPaused = activeHost && settings.pausedHosts.includes(activeHost);
  document.getElementById("pauseSiteBtn").textContent = activeHost
    ? (isPaused ? `Resume on ${activeHost}` : `Pause on ${activeHost}`)
    : "Open a website to pause";

  const { cz_stats = { rejected: 0, hidden: 0 }, cz_log = [] } = await chrome.storage.local.get(["cz_stats", "cz_log"]);
  document.getElementById("rejectedCount").textContent = String(cz_stats.rejected || 0);
  document.getElementById("hiddenCount").textContent = String(cz_stats.hidden || 0);

  const auditEl = document.getElementById("auditList");
  auditEl.innerHTML = cz_log.length ? "" : `<div class="card muted" style="text-align:center;">No cookie banners intercepted yet. Every action is logged transparently here.</div>`;
  for (const row of cz_log) {
    const div = document.createElement("div");
    div.className = "list-item";
    const time = new Date(row.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    div.innerHTML = `<div class="list-item-main"><div style="font-weight:600;">${row.host} <span class="muted">(${row.action})</span></div><div class="muted truncate">${time} · ${row.detail}</div></div>`;
    auditEl.appendChild(div);
  }

  const rulesEl = document.getElementById("rulesList");
  rulesEl.innerHTML = "";
  for (const h of settings.pausedHosts) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<div class="list-item-main truncate">Paused: ${h}</div><button class="btn btn-sm">Resume</button>`;
    div.querySelector("button").addEventListener("click", () => {
      settings.pausedHosts = settings.pausedHosts.filter(x => x !== h);
      save();
    });
    rulesEl.appendChild(div);
  }
  for (const sel of settings.customSelectors) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<div class="list-item-main truncate">Rule: ${sel}</div><button class="btn btn-danger btn-sm">Remove</button>`;
    div.querySelector("button").addEventListener("click", () => {
      settings.customSelectors = settings.customSelectors.filter(x => x !== sel);
      save();
    });
    rulesEl.appendChild(div);
  }
  if (!rulesEl.children.length) {
    rulesEl.innerHTML = `<div class="muted" style="text-align:center;padding:8px;">No paused sites or custom selectors.</div>`;
  }
}

async function init() {
  await billing.init();
  const { cz_settings } = await chrome.storage.local.get("cz_settings");
  if (cz_settings) settings = { ...DEFAULT_SETTINGS, ...cz_settings };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    if (tab?.url && /^https?:/.test(tab.url)) {
      activeHost = new URL(tab.url).hostname;
      document.getElementById("siteHost").textContent = activeHost;
    }
  } catch { /* ignore */ }

  document.querySelectorAll(".tab-btn").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  document.getElementById("tierPill").addEventListener("click", () => switchTab("pro"));
  billing.mountProPanel(document.getElementById("panel-pro"), { onToast: showToast, onTierChange: render });

  document.getElementById("enabledToggle").addEventListener("change", e => { settings.enabled = e.target.checked; save(); });
  document.getElementById("policySelect").addEventListener("change", e => { settings.policy = e.target.value; save(); });
  document.getElementById("declutterToggle").addEventListener("change", e => {
    if (e.target.checked && !billing.isPro()) {
      e.target.checked = false;
      showToast("Newsletter overlay declutter requires ConsentZero Pro.");
      return switchTab("pro");
    }
    settings.declutterOverlays = e.target.checked;
    save();
  });

  document.getElementById("pauseSiteBtn").addEventListener("click", () => {
    if (!activeHost) return;
    if (settings.pausedHosts.includes(activeHost)) {
      settings.pausedHosts = settings.pausedHosts.filter(h => h !== activeHost);
      showToast(`Resumed ConsentZero on ${activeHost}`);
    } else {
      settings.pausedHosts.unshift(activeHost);
      showToast(`Paused ConsentZero on ${activeHost}`);
    }
    save();
  });

  document.getElementById("clearLogBtn").addEventListener("click", async () => {
    await chrome.storage.local.set({ cz_log: [] });
    render();
    showToast("Audit log cleared.");
  });

  document.getElementById("addSelBtn").addEventListener("click", () => {
    if (!billing.isPro()) {
      showToast("Custom selector rules require ConsentZero Pro.");
      return switchTab("pro");
    }
    const inp = document.getElementById("customSelInput");
    const val = inp.value.trim();
    if (!val) return;
    settings.customSelectors.unshift(val);
    inp.value = "";
    save();
    showToast("Custom rule added.");
  });

  render();
}

init();
