// Drives the real native app over the Chrome DevTools Protocol and runs engine-check.mjs inside it.
//   node --experimental-websocket tests/native/cdp-check.mjs --port 9222 --out e2e-out/engine.json
// Android: adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>   (debuggable build)
// Windows/Electron: start the app with --remote-debugging-port=9222
import fs from "node:fs";
import path from "node:path";
import { engineCheck, verdict } from "./engine-check.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PORT = arg("--port", "9222"), OUT = arg("--out", "engine.json"), SHOT = arg("--shot", "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((x) => x.type === "page" && /index\.html|appassets/.test(x.url));
      if (p && p.webSocketDebuggerUrl) return p;
    } catch (_) { /* not up yet */ }
    await sleep(1000);
  }
  throw new Error("no app page on the DevTools port");
}

function client(url) {
  const ws = new WebSocket(url); let id = 0; const wait = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { const { ok, ko } = wait.get(d.id); wait.delete(d.id); d.error ? ko(new Error(JSON.stringify(d.error))) : ok(d.result); } };
  const send = (method, params = {}) => new Promise((ok, ko) => { const i = ++id; wait.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params })); });
  return new Promise((res, rej) => { ws.onopen = () => res({ send, close: () => ws.close() }); ws.onerror = rej; });
}

const p = await target();
console.log("page:", p.url);
const c = await client(p.webSocketDebuggerUrl);
const ev = async (expr, awaitPromise = false) => {
  const r = await c.send("Runtime.evaluate", { expression: expr, awaitPromise, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 800));
  return r.result.value;
};
await c.send("Page.enable");
await c.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__SC_TEST__ = true;" });
await c.send("Page.reload", { ignoreCache: false });
let ready = false;
for (let i = 0; i < 60 && !ready; i++) { await sleep(500); try { ready = await ev("!!(window.__scTest && window.__scTest.playList)"); } catch (_) { /* navigating */ } }
if (!ready) throw new Error("test hooks not available (is this build older than v1.4?)");
console.log("lang/dir:", await ev("document.documentElement.lang + '/' + document.documentElement.dir"));
const R = await ev(`(${engineCheck.toString()})()`, true);
R.netInfo = await ev("(window.SCNative && SCNative.netInfo) ? Promise.resolve(SCNative.netInfo()).then((x) => typeof x === 'string' ? JSON.parse(x) : x) : 'n/a'", true);
R.htmlDir = await ev("document.documentElement.dir"); R.htmlLang = await ev("document.documentElement.lang");
if (SHOT) { const s = await c.send("Page.captureScreenshot", { format: "png" }); fs.mkdirSync(path.dirname(SHOT), { recursive: true }); fs.writeFileSync(SHOT, Buffer.from(s.data, "base64")); }
const fails = verdict(R);
if (R.htmlDir !== "rtl" || R.htmlLang !== "fa") fails.push(`UI is not Persian/RTL (${R.htmlLang}/${R.htmlDir})`);
R.fails = fails;
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 2));
c.close();
if (fails.length) { for (const f of fails) console.log("::error::" + f); process.exit(1); }
console.log("✅ speed, EQ and sleep timer verified in the real app");
