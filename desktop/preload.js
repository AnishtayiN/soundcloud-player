// Exposes a tiny, safe native API to the shared web UI (same contract as the Android bridge)
const { contextBridge, ipcRenderer } = require("electron");
const info = ipcRenderer.sendSync("app-info") || { version: "0.0.0", device: "Windows" };

// native → web events (update progress, incoming app links).
// Delivered straight to the page's registered callback (SCNative.onEvent) — no window.postMessage(msg, "*"),
// and only events that really come from the main process (senderId 0) with the expected shape are passed on.
const listeners = [];
const backlog = [];
function sanitize(msg) {
  if (!msg || typeof msg !== "object" || typeof msg.__sc !== "string" || !/^(upd|link)$/.test(msg.__sc)) return null;
  const out = { __sc: msg.__sc };
  for (const k of ["state", "msg"]) if (typeof msg[k] === "string") out[k] = msg[k].slice(0, 200);
  for (const k of ["received", "total"]) if (typeof msg[k] === "number" && isFinite(msg[k])) out[k] = msg[k];
  return out;
}
ipcRenderer.on("sc-msg", (e, msg) => {
  if (e && e.senderId) return; // only from the main process
  const m = sanitize(msg);
  if (!m) return;
  if (!listeners.length) { backlog.push(m); if (backlog.length > 20) backlog.shift(); return; }
  for (const fn of listeners) { try { fn(m); } catch (_) { /* page error */ } }
});

contextBridge.exposeInMainWorld("SCNative", {
  platform: "windows",
  version: info.version,
  device: info.device,
  openExternal: (url) => ipcRenderer.send("open-external", String(url)),
  setTheme: (bg) => ipcRenderer.send("set-theme", String(bg)),
  mediaState: () => {}, // Windows media keys / SMTC are handled by Chromium's Media Session support
  takeLink: () => ipcRenderer.sendSync("take-link") || "",
  copy: (text) => ipcRenderer.send("copy", String(text)),
  downloadUpdate: (url, version) => ipcRenderer.send("upd-start", String(url), String(version)),
  cancelUpdate: () => ipcRenderer.send("upd-cancel"),
  installUpdate: () => ipcRenderer.send("upd-install"), // explicit user tap → main re-verifies SHA-256, then runs the installer
  onEvent: (fn) => {
    if (typeof fn !== "function" || listeners.length) return; // one subscriber (the app) only
    listeners.push(fn);
    while (backlog.length) { try { fn(backlog.shift()); } catch (_) { /* page error */ } }
  },
});
