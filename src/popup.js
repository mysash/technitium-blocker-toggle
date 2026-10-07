import { getConfig, getStatus, pause, disable, enable } from "./api.js";
import { t, uiLang, fmtTime } from "./i18n.js";

const $ = (id) => document.getElementById(id);
let ticker;

// Statische Texte übersetzen
document.documentElement.lang = uiLang();
document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
document.querySelectorAll("[data-i18n-title]").forEach((el) => {
  el.title = t(el.dataset.i18nTitle);
  el.setAttribute("aria-label", el.title);
});
document.querySelectorAll("[data-minutes]").forEach((b) => (b.textContent = t("minutesShort", b.dataset.minutes)));

function setHeader(titleKey, detail = "") { $("title").textContent = t(titleKey); $("detail").textContent = detail; }
function showError(msg) { $("error").textContent = msg; $("error").hidden = !msg; }
function setBusy(busy) { document.querySelectorAll("main button").forEach((b) => (b.disabled = busy)); }

function render(s) {
  clearInterval(ticker);
  document.body.dataset.state = s.enabled ? "on" : s.till ? "paused" : "off";
  $("enable").hidden = s.enabled;

  if (s.enabled) {
    setHeader("statusActive", t("statusActiveDetail"));
  } else if (s.till) {
    const tick = () => {
      const ms = s.till - Date.now();
      if (ms <= 0) { clearInterval(ticker); setTimeout(refresh, 1500); return; }
      const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
      setHeader("statusPaused", t("statusPausedDetail", fmtTime(s.till), `${m}:${String(sec).padStart(2, "0")}`));
    };
    tick();
    ticker = setInterval(tick, 1000);
  } else {
    setHeader("statusOff", t("statusOffDetail"));
  }
}

async function refresh() {
  setBusy(true);
  try {
    render(await getStatus());
    showError("");
  } catch (e) {
    document.body.dataset.state = "error";
    setHeader("statusNoConnection");
    showError(e.message);
  } finally {
    setBusy(false);
    chrome.runtime.sendMessage("refresh").catch(() => {});
  }
}

async function run(action) {
  setBusy(true);
  try { await action(); } catch (e) { showError(e.message); }
  await refresh();
}

document.querySelectorAll("[data-minutes]").forEach((b) =>
  b.addEventListener("click", () => run(() => pause(Number(b.dataset.minutes)))));
$("disable").addEventListener("click", () => run(disable));
$("enable").addEventListener("click", () => run(enable));

function toggleSettings(show) {
  $("settings").hidden = !show;
  $("controls").hidden = show;
}

$("gear").addEventListener("click", async () => {
  const open = $("settings").hidden;
  if (open) {
    const { baseUrl, token } = await getConfig();
    $("url").value = baseUrl; $("token").value = token;
  }
  toggleSettings(open);
});

$("save").addEventListener("click", async () => {
  const raw = $("url").value.trim().replace(/\/+$/, "");
  const token = $("token").value.trim();
  let url;
  try { url = new URL(raw); } catch { showError(t("errInvalidUrl")); return; }
  if (!token) { showError(t("errTokenMissing")); return; }

  // Firefox schließt das Popup, sobald die Berechtigungsabfrage erscheint –
  // deshalb erst speichern, dann Rechte anfordern (synchron im Klick-Handler).
  const saved = chrome.storage.local.set({ baseUrl: raw, token });
  const granted = await chrome.permissions.request({ origins: [`${url.origin}/*`] });
  await saved;
  if (!granted) { showError(t("errAccessDenied", url.origin)); return; }
  toggleSettings(false);
  refresh();
});

(async () => {
  const { baseUrl, token } = await getConfig();
  if (!baseUrl || !token) {
    toggleSettings(true);
    setHeader("setupTitle", t("setupDetail"));
  } else if (!(await chrome.permissions.contains({ origins: [`${new URL(baseUrl).origin}/*`] }))) {
    toggleSettings(true);
    $("url").value = baseUrl; $("token").value = token;
    setHeader("accessMissingTitle", t("accessMissingDetail"));
  } else {
    refresh();
  }
})();
