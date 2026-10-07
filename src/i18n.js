export const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String)) || key;
export const uiLang = () => chrome.i18n.getUILanguage();
export const fmtTime = (d) => d.toLocaleTimeString(uiLang(), { hour: "2-digit", minute: "2-digit" });
