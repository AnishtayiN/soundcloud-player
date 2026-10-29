// Test harness for the shared web UI (web/app.js).
// Serves ../web on the exact origin the Android WebView uses (https://appassets.androidplatform.net),
// mocks the bot API + GitHub API, and injects a fake native bridge (window.SCNative).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const WEB_DIR = process.env.SC_WEB_DIR || path.resolve(here, "..", "web");
export const ORIGIN = "https://appassets.androidplatform.net";
export const START_URL = `${ORIGIN}/assets/www/index.html`;
export const API = "https://fywphggwavthubehvvuh.supabase.co/functions/v1/scbot/api";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json" };

/** 1 second of 8 kHz mono 16-bit silence, repeated `sec` times → valid WAV the <audio> element can play */
export function silentWav(sec = 30) {
  const rate = 8000, n = rate * sec, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
const WAV = silentWav(30);

export const track = (id, title, artist = "هنرمند تست") => ({
  id, title, artist, username: artist, user_id: 7, permalink_url: `https://soundcloud.com/test/${id}`,
  artwork_url: null, duration_ms: 30000, genre: "pop", playback_count: 1000 + id, drm: false, snipped: false,
});
export const TRENDING = Array.from({ length: 12 }, (_, i) => track(100 + i, ["آهنگ شب", "باران", "خیابان", "دریا", "ماه", "پاییز"][i % 6] + " " + (i + 1)));

/**
 * Install all network mocks + the native bridge on a Playwright page.
 * opts.token      – pre-seed localStorage sc_token (logged in) – default true
 * opts.lang       – pre-seed localStorage sc_lang (default: none → app default)
 * opts.searchDelay(q, offset) → ms delay for /search responses
 * opts.calls      – array that receives every API path requested
 */
export async function setup(page, opts = {}) {
  const calls = opts.calls || [];
  const token = opts.token === undefined ? true : opts.token;
  await page.addInitScript(({ token, lang, testHooks }) => {
    if (testHooks) window.__SC_TEST__ = true;
    if (!sessionStorage.getItem("__seeded")) {
      sessionStorage.setItem("__seeded", "1");
      if (token) localStorage.setItem("sc_token", "test-token-0123456789abcdef");
      if (lang) localStorage.setItem("sc_lang", lang);
      localStorage.setItem("sc_off_auto", "0");
    }
    window.__nativeCalls = [];
    const rec = (name) => (...a) => { window.__nativeCalls.push([name, ...a]); };
    window.SCNative = {
      platform: "android", version: "1.3.1", device: "Test device",
      openExternal: rec("openExternal"), mediaState: rec("mediaState"), setTheme: rec("setTheme"),
      takeLink: () => "", share: rec("share"), copy: rec("copy"),
      downloadUpdate: rec("downloadUpdate"), cancelUpdate: rec("cancelUpdate"), installUpdate: rec("installUpdate"),
    };
  }, { token, lang: opts.lang || "", testHooks: opts.testHooks !== false });

  await page.route("**/*", async (route) => {
    const req = route.request(), url = new URL(req.url());
    // static UI files
    if (url.origin === ORIGIN && url.pathname.startsWith("/assets/www/")) {
      const f = path.join(WEB_DIR, decodeURIComponent(url.pathname.slice("/assets/www/".length)));
      if (!f.startsWith(WEB_DIR) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
    }
    // bot API
    if (req.url().startsWith(API)) {
      const p = req.url().slice(API.length);
      calls.push(p);
      const json = (o, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(o) });
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
      if (opts.api) { const r = await opts.api(p, req, json); if (r !== undefined) return r; }
      if (p.startsWith("/me")) return json({ user: { id: 1, first_name: "آرش", username: "arash", lang: "fa", quality: "high", downloads: 12 }, bot: { username: "SoundClouddl_RoBot" } });
      if (p.startsWith("/home")) return json({ top: TRENDING.slice(0, 5), recent: TRENDING.slice(5, 9) });
      if (p.startsWith("/trending")) return json({ items: TRENDING });
      if (p === "/playlists") return json({ items: [{ id: 1, name: "fav", is_favorites: true, track_count: 2 }, { id: 2, name: "پلی‌لیست شب", track_count: 3, is_public: true }] });
      if (/^\/playlists\/\d+$/.test(p)) return json({ playlist: { id: Number(p.split("/")[2]), name: "پلی‌لیست شب", is_public: true }, tracks: TRENDING.slice(0, 3) });
      if (p.startsWith("/search")) {
        const u = new URL("http://x" + p), q = u.searchParams.get("q") || "", off = Number(u.searchParams.get("offset") || 0);
        const d = opts.searchDelay ? opts.searchDelay(q, off) : 0;
        if (d) await new Promise((r) => setTimeout(r, d));
        const n = off >= 60 ? 0 : 20;
        return json({ items: Array.from({ length: n }, (_, i) => track(10000 + off + i, `${q} — ${off + i + 1}`)) });
      }
      if (p.startsWith("/stream/")) { const id = Number(p.split("/")[2]); return json({ kind: "progressive", url: `https://media.test/a/${id}.wav`, track: track(id, "آهنگ " + id) }); }
      if (p.startsWith("/track/")) { const id = Number(p.split("/")[2]); return json({ track: track(id, "آهنگ " + id) }); }
      if (p.startsWith("/recognize")) return json({ hit: null, tracks: [] });
      if (p.startsWith("/favorites")) return json({ ok: true });
      return json({ error: "not mocked" }, 404);
    }
    if (url.hostname === "media.test") {
      // byte ranges so the <audio> element can seek like on a real CDN
      const m = /bytes=(\d+)-(\d*)/.exec(req.headers()["range"] || "");
      if (!m) return route.fulfill({ status: 200, contentType: "audio/wav", headers: { "accept-ranges": "bytes" }, body: WAV });
      const a = Number(m[1]), b = m[2] ? Math.min(Number(m[2]), WAV.length - 1) : WAV.length - 1;
      return route.fulfill({ status: 206, contentType: "audio/wav", headers: { "accept-ranges": "bytes", "content-range": `bytes ${a}-${b}/${WAV.length}` }, body: WAV.subarray(a, b + 1) });
    }
    if (url.hostname === "api.github.com") {
      const rel = opts.release || { tag_name: "v1.0.0", assets: [] };
      return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(rel) });
    }
    return route.abort();
  });
  return calls;
}

/** wait until the app finished booting (nav rendered) */
export async function boot(page) {
  await page.goto(START_URL);
  await page.waitForSelector(".nav button[data-tab=home]");
}
