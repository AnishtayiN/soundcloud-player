// SoundCloud Player — Windows desktop shell (Electron 22: the last release supporting Windows 7 / 8 / 8.1)
const { app, BrowserWindow, shell, ipcMain, Menu, nativeTheme, clipboard } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { spawn } = require("child_process");

app.setAppUserModelId("com.soundclouddl.player");
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;

// ── app links: scplayer://t/<trackId> | scplayer://p/<playlistCode>  (also accepts https://soundclouddl-player.netlify.app/t/…)
if (app.isPackaged) app.setAsDefaultProtocolClient("scplayer");
function routeOf(argv) {
  for (const a of argv || []) {
    try {
      if (!/^(scplayer:|https:\/\/soundclouddl-player\.netlify\.app\/)/i.test(a)) continue;
      const u = new URL(a);
      const seg = u.pathname.split("/").filter(Boolean);
      if (u.protocol === "scplayer:" && u.hostname) seg.unshift(u.hostname);
      if (seg[0] === "t" && /^\d{1,15}$/.test(seg[1] || "")) return "t_" + seg[1];
      if (seg[0] === "p" && /^[\w-]{3,64}$/.test(seg[1] || "")) return "pl_" + seg[1];
    } catch (_) { /* ignore */ }
  }
  return "";
}
let pendingLink = routeOf(process.argv);
const toWeb = (msg) => { if (win && !win.isDestroyed()) win.webContents.send("sc-msg", msg); };

// ── in-app updater: download installer with progress → run it silently → app relaunches on the new version
let upd = null; // { version, item, file }
function startUpdate(url, version) {
  if (upd) return;
  if (!/^https:\/\/github\.com\//.test(String(url))) return toWeb({ __sc: "upd", state: "error", msg: "bad url" });
  upd = { version: String(version || "new").replace(/[^\w.-]/g, "") };
  win.webContents.session.downloadURL(String(url));
}
function runInstaller(file) {
  let done = false;
  const finish = () => { if (!done) { done = true; setTimeout(() => app.quit(), 300); } };
  try {
    const child = spawn(file, ["--updated", "/S", "--force-run"], { detached: true, stdio: "ignore" });
    child.once("spawn", () => { child.unref(); finish(); });
    child.once("error", () => { shell.openPath(file).finally(finish); }); // fallback: normal installer wizard
  } catch (_) { shell.openPath(file).finally(finish); }
}
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

  win.webContents.session.on("will-download", (_e, item) => {
    if (!upd || upd.item) return; // not ours
    const file = path.join(app.getPath("temp"), `SoundCloud-Player-Setup-${upd.version}.exe`);
    try { fs.unlinkSync(file); } catch (_) { /* not there */ }
    item.setSavePath(file);
    upd.item = item; upd.file = file;
    let last = 0;
    toWeb({ __sc: "upd", state: "progress", received: 0, total: item.getTotalBytes() });
    item.on("updated", (_ev, state) => {
      const now = Date.now();
      if (state === "progressing" && now - last > 120) {
        last = now;
        toWeb({ __sc: "upd", state: "progress", received: item.getReceivedBytes(), total: item.getTotalBytes() });
        if (win && !win.isDestroyed() && item.getTotalBytes()) win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes());
      }
    });
    item.once("done", (_ev, state) => {
      upd = null;
      if (win && !win.isDestroyed()) win.setProgressBar(-1);
      if (state === "completed") {
        const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
        toWeb({ __sc: "upd", state: "done", received: size, total: size });
        setTimeout(() => runInstaller(file), 1800); // let the user see 100%
      } else {
        toWeb({ __sc: "upd", state: state === "cancelled" ? "canceled" : "error", received: 0, total: 0 });
      }
    });
  });
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
ipcMain.on("take-link", (e) => { e.returnValue = pendingLink; pendingLink = ""; });
ipcMain.on("copy", (_e, text) => clipboard.writeText(String(text || "")));
ipcMain.on("upd-start", (_e, url, version) => startUpdate(url, version));
ipcMain.on("upd-cancel", () => { if (upd && upd.item) upd.item.cancel(); else upd = null; });
ipcMain.on("set-theme", (_e, bg) => { if (win && /^#[0-9a-f]{6}$/i.test(bg)) win.setBackgroundColor(bg); });

app.on("second-instance", (_e, argv) => {
  const r = routeOf(argv);
  if (r) { pendingLink = r; toWeb({ __sc: "link" }); }
  if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
