// SoundCloud Player — Windows desktop shell (Electron 22: the last release supporting Windows 7 / 8 / 8.1)
const { app, BrowserWindow, shell, ipcMain, Menu, nativeTheme, clipboard, net } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { pathToFileURL } = require("url");

// DevTools (Ctrl+Shift+I) and F5 reload only for development: `npm start`, or SC_DEVTOOLS=1 / --devtools on a packaged build
const DEV = !app.isPackaged || process.env.SC_DEVTOOLS === "1" || process.argv.includes("--devtools");
const REPO = "AnishtayiN/soundcloud-player";
const EXE_NAME = "SoundCloud-Player-Setup.exe";
const SUMS_NAME = "SHA256SUMS";
const INDEX = path.join(__dirname, "web", "index.html");
const INDEX_URL = pathToFileURL(INDEX).href;

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

// ── in-app updater ────────────────────────────────────────────────────────────────────────────────────────────
//  1. version must be x.y.z and strictly newer than the installed app
//  2. URL is derived from the version (never taken from the page): …/releases/download/v<ver>/SoundCloud-Player-Setup.exe
//  3. expected SHA-256 comes from the release's SHA256SUMS file; the downloaded installer must match it
//  4. nothing runs automatically: state "done" → the user taps "Install" → hash re-checked → installer runs
let upd = null;    // download in progress: { version, url, sha, item, file }
let ready = null;  // verified installer waiting for the user: { version, file, sha }
const semver = (v) => (/^(\d{1,4})\.(\d{1,2})\.(\d{1,2})$/.exec(String(v || "")) || []).slice(1).map(Number);
function cmpVer(a, b) {
  const x = String(a).split(/[.+-]/).map((n) => parseInt(n, 10) || 0), y = String(b).split(/[.+-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1;
  return 0;
}
const updErr = (msg) => toWeb({ __sc: "upd", state: "error", received: 0, total: 0, msg });
function fetchSmall(url, max = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, redirect: "follow" });
    req.setHeader("User-Agent", "SoundCloudPlayer-Windows");
    const tm = setTimeout(() => { req.abort(); reject(new Error("timeout")); }, 20000);
    req.on("redirect", (_s, _m, to) => { if (!/^https:/.test(to)) { req.abort(); reject(new Error("insecure redirect")); } });
    req.on("response", (res) => {
      if (res.statusCode !== 200) { clearTimeout(tm); reject(new Error("HTTP " + res.statusCode)); return; }
      const parts = []; let n = 0;
      res.on("data", (c) => { n += c.length; if (n > max) { req.abort(); clearTimeout(tm); reject(new Error("too large")); } else parts.push(c); });
      res.on("end", () => { clearTimeout(tm); resolve(Buffer.concat(parts).toString("utf8")); });
      res.on("error", (e) => { clearTimeout(tm); reject(e); });
    });
    req.on("error", (e) => { clearTimeout(tm); reject(e); });
    req.end();
  });
}
function parseSum(text, name) {
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^([0-9a-f]{64})\s+\*?(.+?)\s*$/i.exec(line.trim());
    if (m && m[2] === name) return m[1].toLowerCase();
  }
  return null;
}
function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    fs.createReadStream(file).on("data", (d) => h.update(d)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
  });
}
const updDir = () => path.join(app.getPath("temp"), "SoundCloudPlayer-update");
async function startUpdate(_url, version) {
  if (upd) return;
  const v = String(version || "").replace(/^v/, "");
  if (semver(v).length !== 3) return updErr("bad version");
  if (cmpVer(v, app.getVersion()) <= 0) return updErr("not newer");
  const base = `https://github.com/${REPO}/releases/download/v${v}/`;
  upd = { version: v, url: base + EXE_NAME };
  ready = null;
  try {
    const sha = parseSum(await fetchSmall(base + SUMS_NAME), EXE_NAME);
    if (!sha) throw Object.assign(new Error("no checksum"), { verify: true });
    upd.sha = sha;
    fs.mkdirSync(updDir(), { recursive: true });
    if (!win || win.isDestroyed()) { upd = null; return; }
    win.webContents.session.downloadURL(upd.url);
  } catch (e) {
    upd = null;
    updErr(e.verify ? "verify" : String(e.message || e));
  }
}
async function installReady() {
  const r = ready; if (!r) return;
  try {
    if (!fs.existsSync(r.file) || (await sha256File(r.file)) !== r.sha) throw new Error("changed");
  } catch (_) {
    ready = null; try { fs.unlinkSync(r.file); } catch (_e) { /* gone */ }
    return updErr("verify");
  }
  toWeb({ __sc: "upd", state: "installing", received: 0, total: 0 });
  setTimeout(() => runInstaller(r.file), 600);
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
  win.loadFile(INDEX);

  win.webContents.session.on("will-download", (e, item) => {
    const chain = item.getURLChain ? item.getURLChain() : [item.getURL()];
    if (!upd || upd.item || chain[0] !== upd.url) { e.preventDefault(); return; } // only our own, expected download
    const file = path.join(updDir(), EXE_NAME); // fixed, expected file name
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
    item.once("done", async (_ev, state) => {
      const job = upd; upd = null;
      if (win && !win.isDestroyed()) win.setProgressBar(-1);
      if (state !== "completed") {
        toWeb({ __sc: "upd", state: state === "cancelled" ? "canceled" : "error", received: 0, total: 0 });
        return;
      }
      const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
      toWeb({ __sc: "upd", state: "verifying", received: size, total: size });
      let ok = false;
      try { ok = (await sha256File(file)) === job.sha; } catch (_) { ok = false; }
      if (!ok) { try { fs.unlinkSync(file); } catch (_) { /* gone */ } return updErr("verify"); }
      ready = { version: job.version, file, sha: job.sha };
      toWeb({ __sc: "upd", state: "done", received: size, total: size }); // waits for the user's "Install"
    });
  });
  win.once("ready-to-show", () => win.show());

  // all external links → default browser / Telegram Desktop
  win.webContents.setWindowOpenHandler(({ url }) => { if (isSafeExternal(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("file:")) { e.preventDefault(); if (isSafeExternal(url)) shell.openExternal(url); } });
  // development only: F5 = reload, Ctrl+Shift+I = devtools
  if (DEV) {
    win.webContents.on("before-input-event", (e, input) => {
      if (input.type !== "keyDown") return;
      if (input.key === "F5") { win.webContents.reload(); e.preventDefault(); }
      if (input.control && input.shift && input.key.toLowerCase() === "i") { win.webContents.toggleDevTools(); e.preventDefault(); }
    });
  } else {
    win.webContents.on("devtools-opened", () => { if (win && !win.isDestroyed()) win.webContents.closeDevTools(); });
  }
  // renderer crashed / was killed → reload; the UI restores queue / track / position and resumes (#recover=1)
  const gone = [];
  win.webContents.on("render-process-gone", (_e, d) => {
    console.error(`[sc] renderer gone: ${d.reason} (exit ${d.exitCode})`);
    if (!win || win.isDestroyed() || d.reason === "clean-exit") return;
    const now = Date.now(); gone.push(now); while (gone.length && now - gone[0] > 60000) gone.shift();
    if (gone.length > 3) { console.error("[sc] renderer keeps crashing - not reloading again"); return; } // no endless crash loop
    setTimeout(() => { if (win && !win.isDestroyed()) win.loadFile(INDEX, { hash: "recover=1" }); }, 300);
  });
  win.on("closed", () => { win = null; });
}

// IPC is only accepted from our own window's main frame showing our own bundled page
function fromApp(e) {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) return false;
  const f = e.senderFrame;
  if (f && (f !== e.sender.mainFrame || !sameDoc(f.url))) return false;
  return true;
}
// file:///C:/…/web/index.html[#…] — compared decoded + case-insensitively (drive letter / %20 differences on Windows)
const norm = (u) => { try { return decodeURIComponent(String(u || "").split("#")[0].split("?")[0]).replace(/\\/g, "/").toLowerCase(); } catch (_) { return ""; } };
const sameDoc = (u) => norm(u) === norm(INDEX_URL);
const on = (ch, fn) => ipcMain.on(ch, (e, ...a) => { if (!fromApp(e)) { e.returnValue = null; return; } fn(e, ...a); });
// generic device label (no computer name / hostname is sent to the server)
on("app-info", (e) => { e.returnValue = { version: app.getVersion(), device: windowsName() }; });
on("open-external", (_e, url) => { if (isSafeExternal(url)) shell.openExternal(String(url)); });
on("take-link", (e) => { e.returnValue = pendingLink; pendingLink = ""; });
on("copy", (_e, text) => clipboard.writeText(String(text || "")));
on("upd-start", (_e, url, version) => startUpdate(url, version));
on("upd-cancel", () => { if (upd && upd.item) upd.item.cancel(); else upd = null; });
on("upd-install", () => installReady());
// connection type for "auto-download favorites only on Wi-Fi" — Windows 8+ connection-cost API (WinRT) via PowerShell.
// ok = an unrestricted (not metered), non-cellular, non-roaming connection. When Windows can't tell (Windows 7,
// PowerShell blocked, timeout) the answer is {known:false} → the app says so and only downloads after the user agrees.
let netMemo = null;
function netInfo() {
  if (process.platform !== "win32") return Promise.resolve({ known: false });
  if (netMemo && Date.now() - netMemo.at < 20000) return netMemo.p;
  const ps = "$ErrorActionPreference='Stop';[void][Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime];" +
    "$p=[Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile();" +
    "if(-not $p){'none'}else{$c=$p.GetConnectionCost();'{0}|{1}|{2}|{3}|{4}' -f $p.IsWlanConnectionProfile,$p.IsWwanConnectionProfile,$c.NetworkCostType,$c.Roaming,$c.OverDataLimit}";
  const p = new Promise((resolve) => {
    let out = "", done = false;
    const end = (v) => { if (!done) { done = true; resolve(v); } };
    let ch;
    try {
      ch = spawn(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
        ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps], { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    } catch (_) { return end({ known: false }); }
    const timer = setTimeout(() => { try { ch.kill(); } catch (_) {} end({ known: false }); }, 6000);
    ch.stdout.on("data", (d) => { out += d; });
    ch.on("error", () => { clearTimeout(timer); end({ known: false }); });
    ch.on("close", (code) => {
      clearTimeout(timer);
      const line = out.trim().split(/\r?\n/).pop() || "";
      if (code !== 0 || !line) return end({ known: false });
      if (line === "none") return end({ known: true, ok: false, type: "none" });
      const [wlan, wwan, cost, roaming, over] = line.split("|").map((x) => x.trim());
      if (!cost) return end({ known: false });
      const type = wwan === "True" ? "cellular" : wlan === "True" ? "wifi" : "ethernet";
      if (cost === "Unknown") return end({ known: false, type });
      end({ known: true, ok: cost === "Unrestricted" && type !== "cellular" && roaming !== "True" && over !== "True", type, metered: cost !== "Unrestricted" });
    });
  });
  netMemo = { at: Date.now(), p };
  return p;
}
ipcMain.handle("net-info", (e) => (fromApp(e) ? netInfo() : null));
on("set-theme", (_e, bg) => { if (win && /^#[0-9a-f]{6}$/i.test(bg)) win.setBackgroundColor(bg); });

app.on("second-instance", (_e, argv) => {
  const r = routeOf(argv);
  if (r) { pendingLink = r; toWeb({ __sc: "link" }); }
  if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
});
app.on("child-process-gone", (_e, d) => { if (d.reason !== "clean-exit") console.error(`[sc] ${d.type} process gone: ${d.reason} (exit ${d.exitCode})`); });
app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
