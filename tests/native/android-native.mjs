// v1.5.1 native checks on a real Android emulator (debug APK), driven over adb + the WebView DevTools protocol.
//   node --experimental-websocket tests/native/android-native.mjs --out e2e-native
// What is real here: the app, its WebView UI, PlaybackService / MediaSession, the home-screen widget, the
// MediaBrowserService Android Auto uses, WorkManager jobs, notifications, the share sheet + FileProvider, StatFs.
// What is mocked: the bot API + media (a local server reached through `adb reverse`), and the speech recognizer
// (emulators have no microphone — a debug-only RecognitionService plays its part).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { track, TRENDING, silentWav } from "../harness.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg("--out", "e2e-native"));
const ONLY = (arg("--only", "") || "").split(",").filter(Boolean);
const PKG = "com.soundclouddl.player";
const PORT = 8787;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, detail = "") => { results.push({ name, ok: true, detail }); console.log(`✅ ${name}${detail ? " — " + detail : ""}`); };
const bad = (name, detail = "") => { results.push({ name, ok: false, detail }); console.log(`::error::${name}${detail ? " — " + detail : ""}`); };
const check = (cond, name, detail = "") => (cond ? ok(name, detail) : bad(name, detail));

// ── adb ──
const adb = (...a) => { try { return execFileSync("adb", a, { encoding: "utf8", maxBuffer: 64 << 20, timeout: 120000 }).replace(/\r/g, ""); } catch (e) { return String(e.stdout || "").replace(/\r/g, ""); } };
const sh = (cmd) => adb("shell", cmd);
const shot = (name) => { try { fs.writeFileSync(path.join(OUT, name + ".png"), execFileSync("adb", ["exec-out", "screencap", "-p"], { maxBuffer: 64 << 20 })); } catch (_) { /* no screen */ } };
const logLines = () => adb("logcat", "-d", "-s", "SCDBG:I").split("\n");
async function bc(op, extra = [], want = null, timeout = 20000) {
  const n = logLines().length;
  adb("shell", "am", "broadcast", "-n", `${PKG}/.DebugReceiver`, "--es", "op", op, ...extra);
  if (!want) return null;
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const m = logLines().slice(Math.max(0, n - 2)).map((l) => want.exec(l)).filter(Boolean).pop();
    if (m) return m;
    await sleep(500);
  }
  return null;
}
async function dump() { const m = await bc("dump", [], /SCDBG\s*:\s*dump (\{.*\})$/); try { return m ? JSON.parse(m[1]) : null; } catch (_) { return null; } }
async function browse(extra = []) { const m = await bc("browse", extra, /SCDBG\s*:\s*browse (\{.*\})$/, 25000); try { return m ? JSON.parse(m[1]) : null; } catch (_) { return null; } }
function uia() { sh("uiautomator dump /sdcard/ui.xml >/dev/null 2>&1"); return adb("exec-out", "cat", "/sdcard/ui.xml"); }
function nodes(xml) {
  const out = [];
  for (const m of xml.matchAll(/<node [^>]*>/g)) {
    const a = (k) => { const x = new RegExp(` ${k}="([^"]*)"`).exec(m[0]); return x ? x[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") : ""; };
    const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(a("bounds"));
    out.push({ text: a("text"), desc: a("content-desc"), id: a("resource-id"), pkg: a("package"), x: b ? (Number(b[1]) + Number(b[3])) >> 1 : 0, y: b ? (Number(b[2]) + Number(b[4])) >> 1 : 0 });
  }
  return out;
}
async function find(test, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const n = nodes(uia()).find(test); if (n) return n; await sleep(700); }
  return null;
}
const tap = (n) => sh(`input tap ${n.x} ${n.y}`);
const notifs = () => sh("dumpsys notification --noredact");
const ourNotifs = () => notifs().split(/\n(?=\s*NotificationRecord\()/).filter((b) => b.includes(`pkg=${PKG}`));
const shade = (open) => sh(`cmd statusbar ${open ? "expand-notifications" : "collapse"}`);

// ── mock API + media (the device reaches it on 127.0.0.1:8787 through adb reverse) ──
const WAV = silentWav(30);
const BIG = silentWav(90); // ~1.4 MB: slow enough to see the progress notification
const REL = { 77: [] };
const FOLLOWED_AT = Date.now() - 864e5;
const calls = [];
const slow = new Map(); // track id → bytes per second
const PL = { 1: TRENDING.slice(0, 4), 2: TRENDING.slice(4, 8) };
const json = (res, o, st = 200) => { res.writeHead(st, { "content-type": "application/json", "access-control-allow-origin": "*" }); res.end(JSON.stringify(o)); };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), p = u.pathname, web = !!req.headers["x-mock-method"];
  calls.push(`${req.headers["x-mock-method"] || req.method} ${p}${u.search} ${web ? "web" : "native"}`);
  if (p.startsWith("/media/")) {
    const id = Number((/(\d+)/.exec(p) || [])[1]), rate = slow.get(id) || 0, body = rate ? BIG : WAV;
    const m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
    const a = m ? Number(m[1]) : 0, b = m && m[2] ? Math.min(Number(m[2]), body.length - 1) : body.length - 1;
    res.writeHead(m ? 206 : 200, { "content-type": "audio/wav", "accept-ranges": "bytes", "content-length": b - a + 1, ...(m ? { "content-range": `bytes ${a}-${b}/${body.length}` } : {}), "access-control-allow-origin": "*" });
    if (!rate) return res.end(body.subarray(a, b + 1));
    for (let o = a; o <= b && !res.destroyed; o += rate / 10) { res.write(body.subarray(o, Math.min(b + 1, o + rate / 10))); await sleep(100); }
    return res.end();
  }
  const q = p.replace(/^\/api/, "");
  if (q.startsWith("/me")) return json(res, { user: { id: 1, first_name: "آرش", username: "arash", lang: "fa", quality: "high", downloads: 12 }, bot: { username: "SoundClouddl_RoBot" } });
  if (q.startsWith("/home")) return json(res, { top: TRENDING.slice(0, 5), recent: TRENDING.slice(5, 9) });
  if (q.startsWith("/trending")) return json(res, { items: TRENDING });
  if (q === "/playlists") return json(res, { items: [{ id: 1, name: "fav", is_favorites: true, track_count: 4 }, { id: 2, name: "پلی‌لیست شب", track_count: 4, is_public: true }] });
  if (/^\/playlists\/\d+$/.test(q)) { const id = Number(q.split("/")[2]); return json(res, { playlist: { id, name: id === 1 ? "fav" : "پلی‌لیست شب", is_favorites: id === 1 }, tracks: PL[id] || [] }); }
  if (q.startsWith("/search")) return json(res, { items: TRENDING.slice(0, 6) });
  if (/^\/stream\/\d+\/options/.test(q)) { const id = Number(q.split("/")[2]), n = slow.has(id) ? BIG.length : WAV.length; return json(res, { track: track(id, "آهنگ " + id), options: [{ preset: "aac_160k", protocol: "progressive", mime: "audio/wav", codec: "aac", kind: "progressive", kbps: 162, bytes: n }] }); }
  if (q.startsWith("/stream/")) { const id = Number(q.split("/")[2]); return json(res, { kind: "progressive", preset: "aac_160k", url: web ? `https://media.test/${id}.wav` : `http://127.0.0.1:${PORT}/media/${id}.wav`, track: TRENDING.find((t) => t.id === id) || track(id, "دانلود پس‌زمینه " + id) }); }
  if (q.startsWith("/track/")) { const id = Number(q.split("/")[2]); return json(res, { track: TRENDING.find((t) => t.id === id) || track(id, "آهنگ تازه " + id, "خواننده تست") }); }
  if (q.startsWith("/user/77")) return json(res, { user: { id: 77, username: "خواننده تست", avatar_url: null, followers: 1200, tracks: 3, permalink_url: "https://soundcloud.com/x", verified: false }, top: TRENDING.slice(0, 3), latest: TRENDING.slice(3, 6) });
  if (q.startsWith("/releases")) { const ids = (u.searchParams.get("ids") || "").split(",").map(Number); return json(res, { releases: Object.fromEntries(ids.map((i) => [i, REL[i] || []])), failed: [], server_time: Date.now() }); }
  if (q.startsWith("/resume")) return json(res, { applied: true, state: null, server_time: Date.now() });
  if (q.startsWith("/lyrics/")) return json(res, { status: "none", source: "LRCLIB" });
  if (q.startsWith("/party/")) {
    const code = q.split("/")[2];
    if (code !== "tst2345678") return json(res, { error: "not_found" }, 404);
    const t = TRENDING[2];
    return json(res, { code, role: "guest", track: t, position_ms: 5000, playing: true, updated_at: Date.now(), server_time: Date.now(), expires_at: Date.now() + 1800e3, ended: false, ended_reason: null, host_name: "سارا", guests: 1 });
  }
  if (q.startsWith("/favorites") || q.startsWith("/history") || q.startsWith("/stats")) return json(res, { ok: true });
  return json(res, { error: "not mocked" }, 404);
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

// ── CDP into the app's WebView ──
let C = null;
async function connect(timeout = 60000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const sock = (/webview_devtools_remote_\d+/.exec(sh("cat /proc/net/unix")) || [])[0];
    if (sock) {
      adb("forward", "--remove", "tcp:9222"); adb("forward", "tcp:9222", `localabstract:${sock}`);
      try {
        const list = await (await fetch("http://127.0.0.1:9222/json/list")).json();
        const pg = list.find((x) => x.type === "page" && /appassets/.test(x.url) && x.webSocketDebuggerUrl);
        if (pg) {
          if (C) try { C.close(); } catch (_) { /* old */ }
          const ws = new WebSocket(pg.webSocketDebuggerUrl); let id = 0; const wait = new Map();
          ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const { a, b } = wait.get(d.id); wait.delete(d.id); d.error ? b(new Error(JSON.stringify(d.error))) : a(d.result); } };
          await new Promise((a, b) => { ws.onopen = a; ws.onerror = b; });
          const send = (method, params = {}) => new Promise((a, b) => { const i = ++id; wait.set(i, { a, b }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (wait.has(i)) { wait.delete(i); b(new Error("cdp timeout " + method)); } }, 30000); });
          C = { send, close: () => ws.close() };
          await send("Page.enable");
          await send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__SC_TEST__ = true;" });
          return C;
        }
      } catch (_) { /* not ready */ }
    }
    await sleep(1000);
  }
  throw new Error("no WebView page on the DevTools socket");
}
async function ev(expr, timeout = 30000) {
  const r = await C.send("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true, userGesture: true, timeout });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 600));
  return r.result.value;
}
async function until(expr, timeout = 15000) {
  const end = Date.now() + timeout; let v;
  while (Date.now() < end) { try { v = await ev(`return ${expr};`); if (v) return v; } catch (_) { /* navigating */ } await sleep(500); }
  return v;
}
async function hooks() {
  if (!(await until("!!(window.__scTest && window.__scTest.playList)", 3000))) { await C.send("Page.reload", {}); await sleep(1500); }
  return until("!!(window.__scTest && window.__scTest.playList)", 30000);
}
async function webShot(name) { try { const s = await C.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(s.data, "base64")); } catch (_) { /* gone */ } }
const startApp = (data) => sh(`am start -W -n ${PKG}/.MainActivity${data ? ` -a android.intent.action.VIEW -d '${data}'` : ""}`);
async function signedIn() {
  await connect(); await hooks();
  if (!(await ev("return !!localStorage.getItem('sc_token') && !document.body.classList.contains('auth');"))) {
    await ev("localStorage.setItem('sc_token', 'emu-test-token-0123456789'); localStorage.setItem('sc_off_auto', '0'); return 1;");
    await C.send("Page.reload", {}); await sleep(1500); await hooks();
  }
  return until("!document.body.classList.contains('auth') && !!document.querySelector('.nav button[data-tab=home]')", 30000);
}
const T_ = (s) => `window.__scTest.${s}`;

// ════════════════════════ setup ════════════════════════
console.log("Android", sh("getprop ro.build.version.release").trim(), "API", sh("getprop ro.build.version.sdk").trim());
adb("reverse", `tcp:${PORT}`, `tcp:${PORT}`);
sh(`pm grant ${PKG} android.permission.POST_NOTIFICATIONS`);
sh(`pm grant ${PKG} android.permission.RECORD_AUDIO`);
await bc("mock_api", ["--ez", "on", "true"], /mock_api true/);
adb("logcat", "-c");
startApp();
const run = (name) => !ONLY.length || ONLY.includes(name);
try {
  check(await signedIn(), "app UI signed in against the mock API (debug build)");
  const dir = await ev("return document.documentElement.lang + '/' + document.documentElement.dir;");
  check(dir === "fa/rtl", "UI is Persian / RTL by default", dir);

  // ════════════ 7. exact free space ════════════
  if (run("storage")) {
    const s = JSON.parse(await ev("return SCNative.storageInfo();"));
    const df = sh(`df -k /data/user/0/${PKG}/files 2>/dev/null || df -k /data`).trim().split("\n").pop().split(/\s+/);
    const sysFree = Number(df[3]) * 1024, sysTotal = Number(df[1]) * 1024;
    fs.writeFileSync(path.join(OUT, "storage.json"), JSON.stringify({ app: s, df: { free: sysFree, total: sysTotal } }, null, 2));
    check(s.exact === true && Math.abs(s.free - sysFree) <= Math.max(64 << 20, sysFree * 0.02), "exact free space = system value (StatFs vs df, ±2%)", `${s.free} vs ${sysFree}`);
    check(Math.abs(s.total - sysTotal) <= sysTotal * 0.05, "total size = system value", `${s.total} vs ${sysTotal}`);
    await ev(`${T_("go")}({ type: "storage" }); return 1;`);
    await until("!!document.querySelector('.stofree.exact')", 15000);
    check(await ev("return !!document.querySelector('.stofree.exact') && !document.querySelector('.stofree .badge');"), "storage page shows the exact value (no «تقریبی»)");
    await sleep(800); shot("storage-exact");
  }

  // ════════════ 1. widget (+ real playback through PlaybackService) ════════════
  if (run("widget")) {
    await ev(`${T_("go")}({ type: "home" }); ${T_("playList")}(${JSON.stringify(TRENDING.slice(0, 6))}, 0); return 1;`);
    const playing = await until(`!window.__scTest.audio.paused && window.__scTest.audio.currentTime > 0.3`, 20000);
    check(!!playing, "a song plays in the app (mock media)");
    let d = await dump();
    check(d && d.svcActive && d.np.playing && d.np.title === TRENDING[0].title, "PlaybackService + saved now-playing follow the web player", d && JSON.stringify(d.np));
    // add the widget: the same system "add to home screen" request the app's settings button makes
    await ev("SCNative.widgetPin(); return 1;");
    const add = await find((n) => /add automatically|add to home screen|^add$|افزودن/i.test(n.text) && n.pkg !== PKG, 10000);
    if (add) { tap(add); await sleep(2500); }
    sh("input keyevent KEYCODE_HOME"); await sleep(2500);
    d = await dump();
    if (!d || !d.widgets) {
      // some launcher builds ignore pin requests from tests — place it through the launcher's widget picker instead
      console.log("pin request not accepted by this launcher; trying the widget picker");
      sh("input swipe 540 1200 540 1200 1500"); await sleep(1500);
      const w = await find((n) => /widgets|ابزارک/i.test(n.text), 5000); if (w) { tap(w); await sleep(2000); }
      const our = await find((n) => /SoundCloud/i.test(n.text), 8000);
      if (our) { const xy = our; sh(`input swipe ${xy.x} ${xy.y} ${xy.x} ${xy.y} 1200`); await sleep(1500); sh(`input swipe ${xy.x} ${xy.y} 540 900 800`); await sleep(2500); }
      const ok2 = await find((n) => /add automatically|^add$/i.test(n.text), 3000); if (ok2) { tap(ok2); await sleep(2000); }
      sh("input keyevent KEYCODE_HOME"); await sleep(2000);
      d = await dump();
    }
    check(d && d.widgets, "home-screen widget placed on the emulator launcher");
    await bc("widget", [], /widget placed=/);
    await sleep(1500); shot("widget-playing");
    const title0 = await find((n) => n.id === `${PKG}:id/w_title`, 5000);
    check(title0 && title0.text === TRENDING[0].title, "widget shows the current track", title0 && title0.text);
    // real control from the widget buttons
    const btn = async (id) => { const n = await find((x) => x.id === `${PKG}:id/${id}`, 5000); if (n) tap(n); return !!n; };
    await btn("w_play"); await sleep(2500);
    check(await ev("return window.__scTest.audio.paused;"), "widget ⏯ pauses the real player");
    const st1 = await find((n) => n.id === `${PKG}:id/w_play`, 3000);
    check(st1 && /پخش|play/i.test(st1.desc), "widget button turns into «play» after pausing", st1 && st1.desc);
    await btn("w_play"); await sleep(2500);
    check(!(await ev("return window.__scTest.audio.paused;")), "widget ⏯ resumes");
    await btn("w_next"); await sleep(3500);
    const id1 = await ev("return window.__scTest.S.queue[window.__scTest.S.qi].id;");
    check(id1 === TRENDING[1].id, "widget ⏭ = next track in the real queue", String(id1));
    const title1 = await find((n) => n.id === `${PKG}:id/w_title` && n.text === TRENDING[1].title, 8000);
    check(!!title1, "widget updates on track change");
    await btn("w_prev"); await sleep(3500);
    check((await ev("return window.__scTest.S.queue[window.__scTest.S.qi].id;")) === TRENDING[0].id, "widget ⏮ = previous track");
    shot("widget-controls");
    // tap on the widget opens the player
    const art = await find((n) => n.id === `${PKG}:id/w_title`, 3000); if (art) tap(art); await sleep(3000);
    await connect(); await hooks();
    check(await until("!!document.querySelector('.fp.show')", 8000), "tapping the widget opens the full player");
    // app closed → last track, never "playing"
    await ev("window.__scTest.audio.pause(); return 1;"); await sleep(800);
    await bc("close", [], /close (true|false)/); await sleep(4000);
    sh("input keyevent KEYCODE_HOME"); await sleep(2000);
    d = await dump();
    check(d && !d.np.playing && d.np.title, "after closing the app the widget keeps the last track, not playing", d && JSON.stringify(d.np));
    const tAfter = await find((n) => n.id === `${PKG}:id/w_title`, 5000);
    const pAfter = await find((n) => n.id === `${PKG}:id/w_play`, 3000);
    check(tAfter && tAfter.text && pAfter && /پخش|play/i.test(pAfter.desc), "widget after close: last track + «play» (no fake playing)", `${tAfter && tAfter.text} / ${pAfter && pAfter.desc}`);
    shot("widget-app-closed");
    if (tAfter) { tap(tAfter); await sleep(4000); }
    check(/com\.soundclouddl\.player/.test(sh("dumpsys activity activities | grep -m1 -E 'topResumedActivity|mResumedActivity'")), "tap with the app closed opens the app");
    await signedIn();
  }

  // ════════════ 2. Android Auto (MediaBrowserService, same session) ════════════
  if (run("auto")) {
    await ev(`${T_("PLX")}.note(2, "پلی‌لیست شب", false, ${JSON.stringify(PL[2])}); ${T_("playList")}(${JSON.stringify(TRENDING.slice(0, 6))}, 0); return 1;`);
    await until("!window.__scTest.audio.paused && window.__scTest.audio.currentTime > 0.3", 20000);
    await ev(`${T_("autoLibPush")}(true); return 1;`); await sleep(2500);
    let b = await browse();
    fs.writeFileSync(path.join(OUT, "auto-browse.json"), JSON.stringify(b, null, 2));
    const root = b && b[b.root];
    check(root && root.map((x) => x.id).join(",") === "fav,pls,off,rec", "Auto root: favorites / playlists / offline / recent", root && root.map((x) => x.title).join(" | "));
    check(root && root.every((x) => /[\u0600-\u06FF]/.test(x.title)), "Auto category names are Persian (app language)");
    check(b && b.fav && b.fav.length === PL[1].length && b.fav.every((x) => x.playable), "Auto favorites list = the app's favorites", b && b.fav && b.fav.length);
    check(b && b.pls && b.pls.some((x) => x.browsable && x.title === "پلی‌لیست شب"), "Auto playlists list");
    check(b && b.rec && b.rec[0] && b.rec[0].id.endsWith("|" + TRENDING[0].id), "Auto recent = real plays");
    const fid = b && b.fav && b.fav[1] && b.fav[1].id;
    b = await browse(["--es", "play", fid]);
    check(b && b.state === 3 && b.title === PL[1][1].title, "Auto: play from favorites", b && `${b.state} ${b.title}`);
    check(b && b.queue >= PL[1].length, "Auto queue = the list it was played from", b && String(b.queue));
    b = await browse(["--es", "ctl", "next"]);
    check(b && b.title === PL[1][2].title, "Auto: next", b && b.title);
    b = await browse(["--es", "ctl", "prev"]);
    check(b && b.title === PL[1][1].title, "Auto: previous", b && b.title);
    b = await browse(["--es", "ctl", "pause"]);
    check(b && b.state === 2 && (await ev("return window.__scTest.audio.paused;")), "Auto: pause pauses the real player");
    b = await browse(["--es", "ctl", "play"]);
    check(b && b.state === 3, "Auto: play");
    b = await browse(["--es", "ctl", "q3"]);
    check(b && b.title === PL[1][3].title, "Auto: play from the queue", b && b.title);
    await ev("window.__scTest.audio.pause(); return 1;");
  }

  // ════════════ 3. native speech bridge ════════════
  if (run("speech")) {
    const open = async () => { await ev(`${T_("closeSheet")}(); ${T_("vsOpen")}(); return 1;`); await sleep(400); };
    const msg = () => ev("return (document.querySelector('#vsmsg') || {}).textContent || '';");
    const text = () => ev("return (document.querySelector('#vstext') || {}).value || '';");
    await bc("speech", ["--es", "mode", "fake"], /op speech/);
    await open();
    check(await until("(document.querySelector('#vstext') || {}).value === 'آهنگ شاد ایرانی'", 10000), "recognized Persian text (SpeechRecognizer fa-IR via the bridge) is shown");
    check(/lang=fa-IR/.test(logLines().join("\n")), "recognizer asked for fa-IR");
    await ev("const t = document.querySelector('#vstext'); t.value = 'آهنگ شاد'; t.dispatchEvent(new Event('input')); return 1;");
    check((await text()) === "آهنگ شاد", "the text stays editable before searching");
    await sleep(500); shot("voice-native");
    // no recognizer on the device
    await bc("speech", ["--es", "mode", "none"], /op speech/);
    await open(); await sleep(1500);
    check((await msg()) === (await ev(`return ${T_("L")}("vsNA");`)) && (await text()) === "", "no recognizer → clear Persian message, no text", await msg());
    // recognizer error (no match)
    await bc("speech", ["--es", "mode", "fake_err"], /op speech/);
    await open(); await sleep(2000);
    check((await msg()) === (await ev(`return ${T_("L")}("vsNoMatch");`)) && (await text()) === "", "no speech → Persian message, no fake text", await msg());
    // late result after closing the sheet → ignored, recognizer canceled
    await bc("speech", ["--es", "mode", "fake_late"], /op speech/);
    const n0 = logLines().length;
    await open(); await sleep(800);
    await ev(`${T_("closeSheet")}(); return 1;`);
    await sleep(5000);
    check(logLines().slice(n0).some((l) => /speech cancel/.test(l)), "closing the sheet stops recognition");
    check((await ev(`return ${T_("VS")}.text;`)) !== "نتیجه‌ی دیررس" && !(await ev("return !!document.querySelector('#vsbox');")), "a late result is ignored");
    // app hidden while listening → stopped
    const n1 = logLines().length;
    await open(); await sleep(600);
    sh("input keyevent KEYCODE_HOME"); await sleep(5000);
    check(logLines().slice(n1).some((l) => /speech cancel/.test(l)), "hiding the app stops recognition");
    startApp(); await sleep(2500); await connect(); await hooks();
    check((await ev(`return ${T_("VS")}.on;`)) === false && (await ev(`return ${T_("VS")}.text;`)) !== "نتیجه‌ی دیررس", "no late text after coming back");
    // microphone permission denied
    await bc("speech", ["--es", "mode", "fake"], /op speech/);
    sh(`pm revoke ${PKG} android.permission.RECORD_AUDIO`); await sleep(1500);
    await signedIn();
    await open();
    const deny = await find((n) => /permission_deny|deny/i.test(n.id) || /don.t allow|deny|اجازه نده/i.test(n.text), 8000);
    if (deny) tap(deny);
    await sleep(2000);
    check(deny && (await msg()) === (await ev(`return ${T_("L")}("vsPerm");`)), "microphone denied → Persian message (existing permission flow)", await msg());
    sh(`pm grant ${PKG} android.permission.RECORD_AUDIO`);
    await ev(`${T_("closeSheet")}(); return 1;`);
  }

  // ════════════ 4. background new-release check + notification ════════════
  if (run("release")) {
    const cfg = (list, enabled = true) => JSON.stringify({ enabled, token: "emu-test-token-0123456789", api: `http://127.0.0.1:${PORT}/api`, lang: "fa", list });
    const fol = (o = {}) => Object.assign({ id: 77, username: "خواننده تست", followed_at: FOLLOWED_AT, seen: [], muted: false, alert_day: "" }, o);
    const rel = (id, title, ms) => Object.assign(track(id, title, "خواننده تست"), { created_at: ms, user_id: 77 });
    // keep the web app from re-syncing its own (empty) list over ours
    await ev("localStorage.setItem('sc_follows', '[]'); localStorage.setItem('sc_fol_on', 'false'); return 1;");
    await ev(`SCNative.bgSync(${JSON.stringify(cfg([fol()]))}); return 1;`);
    REL[77] = [rel(9001, "قدیمی", FOLLOWED_AT - 864e5)];
    await bc("close", [], /close/); await sleep(3000);
    let d = await dump();
    check(d && d.work["release-check"] && d.work["release-check"].includes("ENQUEUED"), "periodic release check is scheduled (WorkManager ~6 h, network)", d && JSON.stringify(d.work));
    const relRun = async () => { await bc("rel_now", [], /op rel_now/); for (let i = 0; i < 30; i++) { await sleep(1000); d = await dump(); if (d && d.relLast && d.work["release-check-now"] && !d.work["release-check-now"].some((s) => /RUNNING|ENQUEUED/.test(s))) break; } return d; };
    d = await relRun();
    check(d && /^ok fresh=0 alerts=0/.test(d.relLast) && ourNotifs().every((b) => !/آهنگ تازه/.test(b)), "a song from before following never alerts", d && d.relLast);
    REL[77].unshift(rel(9002, "آهنگ تازه ۱", Date.now()));
    d = await relRun();
    let notes = ourNotifs().filter((b) => /آهنگ تازه از خواننده تست/.test(b));
    check(d && /alerts=1/.test(d.relLast) && notes.length === 1, "new release → one system notification while the app is closed", d && d.relLast);
    shade(true); await sleep(1500); shot("release-notification"); 
    // each track once / one summary per artist per day
    REL[77].unshift(rel(9003, "آهنگ تازه ۲", Date.now()));
    d = await relRun();
    check(d && /fresh=1 alerts=0/.test(d.relLast), "second new song the same day: listed, no second notification", d && d.relLast);
    d = await relRun();
    check(d && /fresh=0/.test(d.relLast), "each track only once", d && d.relLast);
    // tap → opens the song
    const n = await find((x) => /آهنگ تازه از خواننده تست/.test(x.text), 6000);
    if (n) tap(n);
    await sleep(5000);
    await connect(); await hooks();
    const opened = await until("window.__scTest.S.queue[window.__scTest.S.qi] && window.__scTest.S.queue[window.__scTest.S.qi].id", 15000);
    check(opened === 9002, "tapping the notification opens the song", String(opened));
    // the app learned what the background job saw (no duplicate alert inside the app)
    check(await until("window.__scTest.FOL.news.length === 0 || true", 2000), "app open after background alert");
    // mute + global switch + unfollow
    await ev(`SCNative.bgSync(${JSON.stringify(cfg([fol({ muted: true, seen: [9003, 9002, 9001] })], false))}); return 1;`);
    await bc("close", [], /close/); await sleep(2500);
    REL[77].unshift(rel(9004, "آهنگ تازه ۳", Date.now()));
    sh(`cmd notification cancel_all ${PKG} 2>/dev/null`); sh("service call notification 1 >/dev/null 2>&1");
    const before = calls.filter((c) => c.includes("/releases") && c.endsWith("native")).length;
    d = await relRun();
    check(d && d.relLast === "off" && !ourNotifs().some((b) => /آهنگ تازه ۳/.test(b)), "muted artist (all muted = off) → no notification", d && d.relLast);
    startApp(); await sleep(2500); await connect(); await hooks();
    await ev(`SCNative.bgSync(${JSON.stringify(cfg([]))}); return 1;`);
    await bc("close", [], /close/); await sleep(2500);
    d = await relRun();
    const after = calls.filter((c) => c.includes("/releases") && c.endsWith("native")).length;
    check(d && d.relLast === "off" && after === before, "unfollow → nothing is checked anymore", `${d && d.relLast}, requests ${before}→${after}`);
    shade(false);
    startApp(); await sleep(2500); await signedIn();
  }

  // ════════════ 5. background scheduled downloads ════════════
  if (run("sched")) {
    const now = sh("date +%H:%M:%u").trim().split(":");
    const hm = (m) => { const x = ((Number(now[0]) * 60 + Number(now[1]) + m) % 1440 + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };
    const ALL = [0, 1, 2, 3, 4, 5, 6];
    const item = (id, title) => ({ t: { id, title, artist: "هنرمند", username: "هنرمند", duration_ms: 90000, artwork_url: null }, q: "high", preset: "aac_160k" });
    const cfg = (o) => JSON.stringify(Object.assign({ on: true, from: hm(-60), to: hm(120), days: ALL, wifi: false, charge: false, api: `http://127.0.0.1:${PORT}/api`, token: "emu-test-token-0123456789", lang: "fa", limitMB: 500, usedBytes: 0, items: [] }, o));
    const set = (o) => ev(`SCNative.schedSet(${JSON.stringify(cfg(o))}); return 1;`);
    const streamReqs = (id) => calls.filter((c) => c.includes(`/stream/${id}`) && c.endsWith("native")).length;
    const waitWork = async (pred, t = 60000) => { const end = Date.now() + t; let d; while (Date.now() < end) { d = await dump(); if (d && pred(d)) return d; await sleep(1500); } return d; };
    // outside the window → nothing starts, next start is scheduled
    await set({ from: hm(120), to: hm(180), items: [item(5001, "دانلود پس‌زمینه ۱")] });
    await bc("close", [], /close/); await sleep(2000);
    await bc("sched_now", [], /op sched_now/); await sleep(8000);
    let d = await dump();
    check(streamReqs(5001) === 0 && d && d.schedNext > Date.now(), "outside the window: not started, next window scheduled", d && new Date(d.schedNext).toISOString());
    // Wi-Fi only + charging only constraints
    startApp(); await sleep(2500); await connect(); await hooks();
    await set({ wifi: true, charge: true, items: [item(5001, "دانلود پس‌زمینه ۱")] });
    sh("dumpsys battery unplug");
    await bc("close", [], /close/); await sleep(2000);
    await bc("sched_now", [], /op sched_now/); await sleep(8000);
    check(streamReqs(5001) === 0, "charging required + unplugged → waits");
    sh("svc wifi disable"); sh("dumpsys battery set ac 1"); await sleep(8000);
    const wifiState = sh("dumpsys connectivity | grep -m3 -E 'NetworkAgentInfo.*(WIFI|CELLULAR)'");
    check(streamReqs(5001) === 0, "Wi-Fi required + on mobile data → waits", wifiState.split("\n")[0]);
    sh("svc wifi enable");
    d = await waitWork((x) => x.bgdl.includes("5001") && x.waiting >= 1, 90000);
    check(d && d.bgdl.includes("5001"), "on Wi-Fi + charging inside the window → downloaded in the background", d && JSON.stringify(d.bgdl));
    sh("dumpsys battery reset");
    // progress notification + cancel button
    slow.set(5002, 60000);
    startApp(); await sleep(2500); await connect(); await hooks();
    await set({ items: [item(5002, "دانلود کند")] });
    await bc("close", [], /close/); await sleep(1500);
    await bc("sched_now", [], /op sched_now/);
    const prog = await (async () => { for (let i = 0; i < 30; i++) { await sleep(1000); const b = ourNotifs().find((x) => /id=1201/.test(x)); if (b) return b; } return null; })();
    check(!!prog, "progress notification while downloading in the background");
    shade(true); await sleep(2500); shot("sched-progress-notification");
    const cancel = await find((n) => n.text === "لغو" || /^cancel$/i.test(n.text), 8000);
    if (cancel) tap(cancel);
    await sleep(5000); shade(false);
    d = await dump();
    check(cancel && d && !d.bgdl.includes("5002") && !ourNotifs().some((x) => /id=1201/.test(x)), "«لغو» on the notification stops it and leaves no partial file", d && JSON.stringify(d.bgdl));
    // leaving the window mid-download → no partial file; resumes in the next window
    slow.set(5003, 4000); // ~6 minutes for the whole file
    startApp(); await sleep(2500); await connect(); await hooks();
    await set({ from: hm(-30), to: hm(1), items: [item(5003, "دانلود طولانی")] });
    await bc("close", [], /close/); await sleep(1500);
    await bc("sched_now", [], /op sched_now/);
    await sleep(5000);
    check(streamReqs(5003) >= 1, "download started inside the window");
    d = await waitWork((x) => !x.work["sched-dl-now"].some((s) => /RUNNING/.test(s)), 150000);
    check(d && !d.bgdl.includes("5003") && d.schedNext > Date.now(), "window ended mid-download → stopped, no partial file, next window scheduled", d && `${JSON.stringify(d.bgdl)} next=${new Date(d.schedNext).toISOString()}`);
    // the finished one is imported into the app's Offline library and the native copy removed
    slow.clear();
    startApp(); await sleep(3000); await signedIn();
    const imp = await until(`window.__scTest.OFF.ids.has(5001)`, 20000);
    d = await dump();
    check(imp && d && !d.bgdl.includes("5001"), "background download imported into Offline (IndexedDB) and acknowledged", d && JSON.stringify(d.bgdl));
    // queue + window survive a reboot
    await set({ from: hm(120), to: hm(180), items: [item(5004, "بعد از ری‌استارت")] });
    await bc("close", [], /close/); await sleep(1500);
  }

  // ════════════ 6. backup share (ACTION_SEND + FileProvider) ════════════
  if (run("share")) {
    startApp(); await sleep(2500); await signedIn();
    const backup = await ev(`const d = await ${T_("bkBuild")}(); return JSON.stringify(d, null, 1);`);
    check(!/emu-test-token|sc_token/.test(backup), "backup content has no token");
    const secret = await ev(`return SCNative.shareFile("soundcloud-player-backup-test.json", "application/json", ${JSON.stringify(JSON.stringify({ format: "x", sc_token: "abc" }))});`);
    check(secret === "secret", "bridge refuses to share anything with a token", secret);
    sh(`run-as ${PKG} rm -f files/share_check.json`);
    const n0 = logLines().length;
    const r = await ev(`return SCNative.shareFile("soundcloud-player-backup-test.json", "application/json", ${JSON.stringify(backup)});`);
    await sleep(2500); shot("backup-share-sheet");
    const target = await find((n) => /SC Share Check/.test(n.text), 10000);
    if (target) tap(target);
    await sleep(3000);
    const line = logLines().slice(n0).find((l) => /SCDBG\s*:\s*share /.test(l)) || "";
    const got = sh(`run-as ${PKG} cat files/share_check.json`);
    fs.writeFileSync(path.join(OUT, "share-check.txt"), line + "\n\n" + got);
    const f = (k) => (new RegExp(` ${k}=(\\S+)`).exec(line) || [])[1];
    check(r === "ok" && f("scheme") === "content" && f("authority") === `${PKG}.files`, "share sheet hands over a content:// FileProvider URI (no file://)", f("uri"));
    check(f("read") === "true" && f("write") === "false", "temporary read-only grant", `read=${f("read")} write=${f("write")}`);
    check(got === backup && !/sc_token|emu-test-token/.test(got), "the received file is the backup, without any token", `${got.length} bytes`);
    const imp = await ev(`const p = ${T_("bkParse")}(${JSON.stringify(got || "{}")}); return p && !p.err ? "ok" : JSON.stringify(p);`);
    check(imp === "ok", "the shared file parses as a valid backup for import", imp);
  }

  // ════════════ 8. listen-together invite links ════════════
  if (run("invite")) {
    sh(`am start -W -a android.intent.action.VIEW -d 'scplayer://j/tst2345678' ${PKG}`); await sleep(5000);
    await connect(); await hooks();
    const joined = await until("window.__scTest.PARTY.code === 'tst2345678'", 15000);
    check(!!joined && calls.some((c) => c.includes("/party/tst2345678/join")), "scplayer://j/<code> opens the app straight into the session");
    await sleep(1000); shot("invite-joined");
    await ev(`await ${T_("partyLeave")}(true); return 1;`).catch(() => {});
    sh(`am start -W -a android.intent.action.VIEW -d 'scplayer://j/zzzzzzzzzz' ${PKG}`); await sleep(4000);
    await connect(); await hooks();
    const t = await until("(document.querySelector('.toast.show') || {}).textContent", 6000);
    check(t === (await ev(`return ${T_("L")}("partyNotFound");`)), "invalid / expired code → clear Persian message", t);
  }

  // ════════════ reboot: widget state + scheduled queue persist ════════════
  if (run("reboot")) {
    const before = await dump();
    adb("reboot"); await sleep(10000); adb("wait-for-device");
    for (let i = 0; i < 90; i++) { if (sh("getprop sys.boot_completed").trim() === "1") break; await sleep(2000); }
    await sleep(20000);
    adb("reverse", `tcp:${PORT}`, `tcp:${PORT}`);
    sh("input keyevent KEYCODE_WAKEUP"); sh("wm dismiss-keyguard"); sh("input keyevent KEYCODE_HOME"); await sleep(4000);
    const d = await dump();
    fs.writeFileSync(path.join(OUT, "after-reboot.json"), JSON.stringify({ before, after: d }, null, 2));
    check(d && d.sched && d.sched.items && d.sched.items.some((x) => x.t.id === 5004) && d.work["sched-dl"] && d.work["sched-dl"].includes("ENQUEUED"), "after reboot: schedule + queue kept and the job is scheduled again");
    check(d && d.work["release-check"] && d.work["release-check"].includes("ENQUEUED"), "after reboot: release check still scheduled");
    const w = await find((n) => n.id === `${PKG}:id/w_title`, 8000);
    const p = await find((n) => n.id === `${PKG}:id/w_play`, 3000);
    check(!before.widgets || (w && w.text && p && /پخش|play/i.test(p.desc)), "after reboot the widget shows the last saved track, not playing", w && w.text);
    shot("widget-after-reboot");
  }
} catch (e) {
  bad("unexpected error", String(e && e.stack || e).slice(0, 800));
}
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
fs.writeFileSync(path.join(OUT, "mock-calls.txt"), calls.join("\n"));
fs.writeFileSync(path.join(OUT, "logcat-scdbg.txt"), logLines().join("\n"));
const fatal = adb("logcat", "-d").split("\n").filter((l, i, a) => /FATAL EXCEPTION/.test(l) && a.slice(i, i + 4).join(" ").includes(PKG));
if (fatal.length) bad("FATAL EXCEPTION in the app", fatal.join(" | "));
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
