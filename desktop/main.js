// SoundCloud Player — Windows desktop shell (Electron 22: the last release supporting Windows 7 / 8 / 8.1)
const { app, BrowserWindow, shell, ipcMain, Menu, nativeTheme } = require("electron");
const path = require("path");
const os = require("os");

app.setAppUserModelId("com.soundclouddl.player");
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

function windowsName() {
  const [maj, min, build] = os.release().split(".").map(Number);
  if (maj === 6 && min === 1) return "Windows 7";
  if (maj === 6 && min === 2) return "Windows 8";
  if (maj === 6 && min === 3) return "Windows 8.1";
  if (maj === 10) return build >= 22000 ? "Windows 11" : "Windows 10";
  return "Windows " + os.release();
}
const isSafeExternal = (u) => /^(https?:|tg:)/i.test(String(u || ""));

function createWindow() {
  win = new BrowserWindow({
    width: 460, height: 880, minWidth: 360, minHeight: 600,
    title: "SoundCloud Player",
    icon: path.join(__dirname, "build", "icon.png"),
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0b0b10" : "#f6f6fa",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,          // keep playing/advancing tracks while minimized
      autoplayPolicy: "no-user-gesture-required",
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "web", "index.html"));
  win.once("ready-to-show", () => win.show());

  // all external links → default browser / Telegram Desktop
  win.webContents.setWindowOpenHandler(({ url }) => { if (isSafeExternal(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file:")) { e.preventDefault(); if (isSafeExternal(url)) shell.openExternal(url); } });
  // F5 = reload, Ctrl+Shift+I = devtools (handy for bug reports)
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F5") { win.webContents.reload(); e.preventDefault(); }
    if (input.control && input.shift && input.key.toLowerCase() === "i") { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  win.on("closed", () => { win = null; });
}

ipcMain.on("app-info", (e) => { e.returnValue = { version: app.getVersion(), device: `${windowsName()} · ${os.hostname()}`.slice(0, 60) }; });
ipcMain.on("open-external", (_e, url) => { if (isSafeExternal(url)) shell.openExternal(String(url)); });
ipcMain.on("set-theme", (_e, bg) => { if (win && /^#[0-9a-f]{6}$/i.test(bg)) win.setBackgroundColor(bg); });

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
