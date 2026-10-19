// Exposes a tiny, safe native API to the shared web UI (same contract as the Android bridge)
const { contextBridge, ipcRenderer } = require("electron");
const info = ipcRenderer.sendSync("app-info");
contextBridge.exposeInMainWorld("SCNative", {
  platform: "windows",
  version: info.version,
  device: info.device,
  openExternal: (url) => ipcRenderer.send("open-external", String(url)),
  setTheme: (bg) => ipcRenderer.send("set-theme", String(bg)),
  mediaState: () => {}, // Windows media keys / SMTC are handled by Chromium's Media Session support
});
