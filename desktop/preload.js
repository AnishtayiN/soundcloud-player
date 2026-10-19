// Exposes a tiny, safe native API to the shared web UI (same contract as the Android bridge)
const { contextBridge, ipcRenderer } = require("electron");
const info = ipcRenderer.sendSync("app-info");
// native → web events (update progress, incoming app links) arrive as window.postMessage({ __sc: … })
ipcRenderer.on("sc-msg", (_e, msg) => window.postMessage(msg, "*"));
contextBridge.exposeInMainWorld("SCNative", {
  platform: "windows",
  version: info.version,
  device: info.device,
  openExternal: (url) => ipcRenderer.send("open-external", String(url)),
  setTheme: (bg) => ipcRenderer.send("set-theme", String(bg)),
  mediaState: () => {}, // Windows media keys / SMTC are handled by Chromium's Media Session support
  takeLink: () => ipcRenderer.sendSync("take-link"),
  copy: (text) => ipcRenderer.send("copy", String(text)),
  downloadUpdate: (url, version) => ipcRenderer.send("upd-start", String(url), String(version)),
  cancelUpdate: () => ipcRenderer.send("upd-cancel"),
  installUpdate: () => {},
});
