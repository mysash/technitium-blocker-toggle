// Technitium DNS Server HTTP API – https://github.com/TechnitiumSoftware/DnsServer/blob/master/APIDOCS.md
import { t, fmtTime } from "./i18n.js";

export async function getConfig() {
  const { baseUrl = "", token = "" } = await chrome.storage.local.get(["baseUrl", "token"]);
  return { baseUrl: baseUrl.replace(/\/+$/, ""), token };
}

async function call(path, params = {}) {
  const { baseUrl, token } = await getConfig();
  if (!baseUrl || !token) throw new Error(t("errMissingConfig"));

  const url = new URL(baseUrl + path);
  url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  let res;
  try {
    res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
  } catch (e) {
    throw new Error(e.name === "AbortError" ? t("errTimeout") : t("errUnreachable"));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(t("errHttp", res.status));
  const data = await res.json();
  if (data.status === "invalid-token") throw new Error(t("errInvalidToken"));
  if (data.status !== "ok") throw new Error(data.errorMessage || t("errApi", data.status));
  return data.response;
}

/** { enabled: bool, till: Date|null } – till ist gesetzt, wenn temporär pausiert */
export async function getStatus() {
  const r = await call("/api/settings/get");
  const till = r.temporaryDisableBlockingTill ? new Date(r.temporaryDisableBlockingTill) : null;
  return { enabled: !!r.enableBlocking, till: till && till > new Date() ? till : null };
}

export const pause   = (minutes) => call("/api/settings/temporaryDisableBlocking", { minutes });
export const disable = () => call("/api/settings/set", { enableBlocking: "false" });
export const enable  = () => call("/api/settings/set", { enableBlocking: "true" });

export async function updateBadge() {
  let text = "", color = "#6b7280", title;
  try {
    const s = await getStatus();
    if (s.enabled) {
      title = t("tooltipActive");
    } else if (s.till) {
      const min = Math.max(1, Math.ceil((s.till - Date.now()) / 60000));
      text = `${min}m`; color = "#b7791f";
      title = t("tooltipPaused", fmtTime(s.till));
      // Badge exakt zum Pausenende aktualisieren statt bis zum nächsten Minuten-Poll zu warten
      chrome.alarms.create("expire", { when: s.till.getTime() + 2000 });
    } else {
      text = t("badgeOff"); color = "#b4382a"; title = t("tooltipOff");
    }
  } catch (e) {
    text = "?"; title = t("tooltipError", e.message);
  }
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setTitle({ title });
}
