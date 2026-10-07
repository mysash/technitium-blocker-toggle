import { updateBadge } from "./api.js";

function setup() {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
  updateBadge();
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "refresh" || a.name === "expire") updateBadge();
});
chrome.runtime.onMessage.addListener((msg) => { if (msg === "refresh") updateBadge(); });
// Rechte können auch nachträglich (z. B. über about:addons) erteilt werden
chrome.permissions.onAdded.addListener(() => updateBadge());
