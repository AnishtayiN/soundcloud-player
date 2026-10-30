// v1.5 feature tests for the shared web UI (Android WebView origin + fake native bridge).
// sync listening · voice + offline search · storage · backup · schedule · release alerts · video recognition
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setup, boot, track, TRENDING } from "./harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.join(HERE, "media");
const VIEW = { width: 412, height: 860 };
test.use({ viewport: VIEW, locale: "fa-IR" });

const T = (page, fn, arg) => page.evaluate(fn, arg);
const toastText = (page) => page.locator(".toast.show");
const sheetGone = (page) => page.waitForFunction(() => !document.querySelector(".ov.show")).then(() => page.waitForTimeout(450));
const playing = (page) => page.waitForFunction(() => { const a = window.__scTest; return a && !a.S.loadingTrack && !a.audio.paused && a.audio.currentTime > 0; });
const pos = (page) => T(page, () => ({ t: window.__scTest.audio.currentTime, paused: window.__scTest.audio.paused, id: window.__scTest.S.queue[window.__scTest.S.qi]?.id }));
const nCalls = (page, name) => T(page, (n) => window.__nativeCalls.filter((c) => c[0] === n), name);
async function playTrend(page, n) {
  await page.waitForSelector("#trend .tr");
  await page.click(`#trend .tr >> nth=${n}`);
  await playing(page);
}
// extra native bridges added in v1.5 (recorded like the others)
const NATIVE_V15 = () => {
  const rec = (name, ret) => (...a) => { window.__nativeCalls.push([name, ...a]); return ret; };
  Object.assign(window.SCNative, { notify: rec("notify"), bgSync: rec("bgSync"), schedSet: rec("schedSet"), shareFile: rec("shareFile", true), saveFile: rec("saveFile", true) });
  window.SCNative.takeLink = () => { const l = window.__link || ""; window.__link = ""; return l; };
};
const idbAudio = (page) => page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("sc_offline"); r.onsuccess = () => { const tx = r.result.transaction(["audio", "meta", "lyrics"]); const out = { sizes: {}, meta: [], lyrics: [] };
    const a = tx.objectStore("audio").openCursor(); a.onsuccess = () => { const c = a.result; if (c) { out.sizes[c.key] = c.value.size; c.continue(); } };
    const m = tx.objectStore("meta").getAllKeys(); m.onsuccess = () => { out.meta = m.result; };
    const l = tx.objectStore("lyrics").getAllKeys(); l.onsuccess = () => { out.lyrics = l.result; };
    tx.oncomplete = () => res(out); };
}));
const offPut = (page, list) => T(page, async (list) => {
  const t = window.__scTest;
  for (const x of list) {
    const tr = Object.assign({ id: x.id, title: x.title, artist: x.artist || "هنرمند", username: x.artist || "هنرمند", user_id: 7, duration_ms: 30000, artwork_url: null, permalink_url: "https://soundcloud.com/x/" + x.id }, x);
    // a real (silent) 8 kHz 8-bit WAV of exactly `size` bytes → playable, and storage totals stay exact
    const size = x.size || 160044, b = new Uint8Array(size).fill(128), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < 4; i++) b[o + i] = s.charCodeAt(i); };
    w(0, "RIFF"); v.setUint32(4, size - 8, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, size - 44, true);
    await t.offPut(tr, new Blob([b], { type: "audio/wav" }), x.pinned !== false);
    const m = t.OFF.meta.get(x.id);
    if (x.savedDaysAgo) m.saved = m.last = Date.now() - x.savedDaysAgo * 864e5;
    if (x.playedDaysAgo != null) m.played = Date.now() - x.playedDaysAgo * 864e5;
    await t.offTx("meta", "readwrite", (st) => st.put(m));
  }
}, list);

// ── in-memory backend for /party (same rules as the party_op() SQL function) ──
const CODE_CHARS = "23456789abcdefghjkmnpqrstuvwxyz";
function partyServer() {
  const sess = new Map(), st = { skew: 0 }, calls = [];
  const now = () => Date.now() + st.skew;
  const names = { 1: "آرش", 2: "سارا", 3: "نیما" };
  const user = (req) => ({ tokA: 1, tokB: 2, tokC: 3 }[req.headers()["x-app-token"]] || 1);
  const out = (s, role) => ({ code: s.code, role, track: s.track, position_ms: s.position_ms, playing: s.playing, updated_at: s.updated_at, server_time: now(),
    expires_at: s.last_active + 1800e3, ended: s.ended, ended_reason: s.ended_reason, host_name: names[s.host],
    guests: [...s.members.entries()].filter(([m, t]) => m !== s.host && now() - t < 30000).length });
  function handle(p, req, json) {
    if (!p.startsWith("/party")) return;
    const u = user(req), seg = p.split("?")[0].split("/").filter(Boolean), body = req.method() === "POST" ? (req.postDataJSON() || {}) : {};
    calls.push([u, req.method(), p]);
    if (seg[1] === "start") {
      for (const s of sess.values()) if (s.host === u && !s.ended) { s.ended = true; s.ended_reason = "host"; }
      let code = ""; while (code.length < 10) code += CODE_CHARS[Math.floor(Math.random() * 31)];
      const s = { code, host: u, track: body.track || null, position_ms: body.position_ms || 0, playing: !!body.playing, updated_at: now(), last_active: now(), ended: false, ended_reason: null, members: new Map([[u, now()]]) };
      sess.set(code, s); return json(out(s, "host"));
    }
    const s = sess.get(seg[1]); if (!s) return json({ error: "not_found" }, 404);
    if (!s.ended && s.last_active < now() - 1800e3) { s.ended = true; s.ended_reason = "expired"; }
    let role = s.host === u ? "host" : s.members.has(u) ? "guest" : null;
    const op = req.method() === "GET" ? "get" : seg[2];
    if (op === "join") { if (s.ended) return json({ error: "ended", reason: s.ended_reason }, 410); if (!role) { s.members.set(u, now()); role = "guest"; } }
    else if (!role) return json({ error: "forbidden" }, 403);
    if (op === "state") {
      if (role !== "host") return json({ error: "forbidden" }, 403);
      if (s.ended) return json({ error: "ended", reason: s.ended_reason }, 410);
      if (body.track) s.track = body.track; if (body.position_ms != null) s.position_ms = body.position_ms; if (typeof body.playing === "boolean") s.playing = body.playing;
      s.updated_at = now(); s.last_active = now();
    }
    if (op === "leave") { if (role === "host") { s.ended = true; s.ended_reason = s.ended_reason || "host"; } else { s.members.delete(u); return json({ left: true }); } }
    if (op === "end") { if (role !== "host") return json({ error: "forbidden" }, 403); s.ended = true; s.ended_reason = s.ended_reason || "host"; }
    s.members.set(u, now());
    return json(out(s, role));
  }
  return { handle, sess, st, calls };
}

// ═════════════════════ 8. video recognition (app file picker) ═════════════════════
test.describe("video recognition (file picker → same /recognize endpoint)", () => {
  const HIT = { title: "Tone Song", artist: "Test Artist", cover: null };
  async function pick(page, file) {
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    await page.waitForSelector(".sheet.show .rec");
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click(".sheet.show [data-act=recfile]")]);
    expect(await fc.element().getAttribute("accept")).toContain("video/*");
    await fc.setFiles(path.join(MEDIA, file));
  }
  const MIC_DENY = () => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("denied"), { name: "NotAllowedError" })); };

  // Playwright's Chromium has no AAC decoder (Android WebView / Electron / Telegram do): AAC files exercise the fallback
  // where the app sends only the cut windows (ADTS) and the server decodes them; MP3-in-MP4 is decoded in the page.
  const checkBody = (b, codec) => {
    if (b.sigs) {
      expect(b.sigs.length).toBeGreaterThanOrEqual(1); expect(b.sigs.length).toBeLessThanOrEqual(4);
      for (const s of b.sigs) { expect(s.uri).toMatch(/^data:audio\/vnd\.shazam\.sig;base64,/); expect(s.samplems).toBeGreaterThan(2500); }
      return "sigs";
    }
    expect(b.clips.length).toBeGreaterThanOrEqual(1); expect(b.clips.length).toBeLessThanOrEqual(4);
    for (const c of b.clips) {
      expect(c.codec).toBe(codec);
      const raw = Buffer.from(c.b64, "base64");
      expect(raw.length).toBeLessThan(900000); // a 12 s window, never the whole video
      if (codec === "aac") { expect(raw[0]).toBe(0xff); expect(raw[1] & 0xf6).toBe(0xf0); }
    }
    return "clips";
  };
  for (const [file, codec, mode] of [["tone.mp4", "aac", null], ["tone.mov", "aac", null], ["mp3in.mp4", "mp3", "sigs"]]) {
    test(`music video ${file} → audio windows → «🎬 این آهنگ» with the existing actions`, async ({ page }) => {
      const bodies = [];
      await page.addInitScript(MIC_DENY);
      await setup(page, { api: (p, req, json) => {
        if (p.startsWith("/recognize")) { bodies.push(req.postDataJSON()); return json({ hit: HIT, tracks: [track(900, "Tone Song", "Test Artist")], matched: 1, tried: 1 }); }
      } });
      await boot(page);
      await pick(page, file);
      await expect(page.locator(".sheet.show .rres h3")).toHaveText("Tone Song", { timeout: 20000 });
      await expect(page.locator(".sheet.show .rmeta small")).toHaveText("🎬 این آهنگ");
      await expect(page.locator(".sheet.show .racts .btn")).toHaveCount(5);
      expect(bodies.length).toBe(1); // ONE request with several windows (per-user rate limit)
      const m = checkBody(bodies[0], codec);
      if (mode) expect(m).toBe(mode);
      expect(await T(page, () => window.__scTest.REC.fileCtx)).toBeNull(); // decoder released
    });
  }
  for (const [file, msg] of [["silent_mp3.mp4", "این ویدیو صدا ندارد"], ["noaudio.mp4", "این ویدیو صدا ندارد"], ["corrupt.mp4", "این فایل قابل تشخیص نیست"]]) {
    test(`${file} → «${msg}», nothing sent, no fake result`, async ({ page }) => {
      const calls = [];
      await page.addInitScript(MIC_DENY);
      await setup(page, { calls });
      await boot(page);
      await pick(page, file);
      await expect(page.locator(".sheet.show .rec h3")).toHaveText(msg, { timeout: 20000 });
      expect(calls.filter((c) => c.startsWith("/recognize")).length).toBe(0);
      await expect(page.locator(".sheet.show .rres")).toHaveCount(0);
    });
  }
  test("silent AAC video decoded by the server → «این ویدیو صدا ندارد» (server reason, no fake result)", async ({ page }) => {
    const bodies = [];
    await page.addInitScript(MIC_DENY);
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) { const b = req.postDataJSON(); bodies.push(b); return json(b.clips ? { hit: null, tracks: [], tried: 0, reason: "silent" } : { hit: null, tracks: [], tried: 0 }); } } });
    await boot(page);
    await pick(page, "silent.mp4");
    await expect(page.locator(".sheet.show .rec h3")).toHaveText("این ویدیو صدا ندارد", { timeout: 20000 });
    expect(bodies.length).toBeLessThanOrEqual(1);
    if (bodies.length) checkBody(bodies[0], "aac"); // only possible as clips: silence never becomes a signature
    await expect(page.locator(".sheet.show .rres")).toHaveCount(0);
  });
  test("not found → «این آهنگ پیدا نشد» + «جستجو با نام» opens search", async ({ page }) => {
    await page.addInitScript(MIC_DENY);
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) return json({ hit: null, tracks: [], tried: 2 }); } });
    await boot(page);
    await pick(page, "tone.mp4");
    await expect(page.locator(".sheet.show .rec h3")).toHaveText("این آهنگ پیدا نشد", { timeout: 20000 });
    await page.click(".sheet.show [data-act=recname]");
    await sheetGone(page);
    await expect(page.locator(".nav button[data-tab=search]")).toHaveClass(/on/);
    await expect(page.locator("#q")).toBeFocused();
  });
  test("voice/MP3 file regression: an audio file still uses the single-signature request", async ({ page }) => {
    const bodies = [];
    await page.addInitScript(MIC_DENY);
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) { bodies.push(req.postDataJSON()); return json({ hit: HIT, tracks: [track(900, "Tone Song")], matched: 1 }); } } });
    await boot(page);
    await pick(page, "tone.mp3");
    await expect(page.locator(".sheet.show .rres h3")).toHaveText("Tone Song", { timeout: 20000 });
    await expect(page.locator(".sheet.show .rmeta small")).toContainText("🎯");
    expect(bodies.length).toBe(1);
    expect(typeof bodies[0].uri).toBe("string");
    expect(bodies[0].sigs).toBeUndefined();
  });
});

// ═════════════════════ 1. synchronized listening ═════════════════════
test.describe("synchronized listening", () => {
  async function client(browser, srv, tok, extra = {}) {
    const ctx = await browser.newContext({ viewport: VIEW, locale: "fa-IR" });
    const page = await ctx.newPage();
    await setup(page, { seed: { sc_token: tok }, api: (p, req, json) => srv.handle(p, req, json), ...extra });
    await page.addInitScript(NATIVE_V15); // after setup(): extends the fake SCNative
    await boot(page);
    return { ctx, page };
  }
  const joinByLink = async (page, code) => { await T(page, (c) => { window.__link = "j_" + c; window.postMessage({ __sc: "link" }, "*"); }, code); };
  const near = async (G, H, tol = 3) => expect.poll(async () => { const g = await pos(G), h = await pos(H); return g.id === h.id && Math.abs(g.t - h.t) <= tol; }, { timeout: 15000 }).toBe(true);

  test("two clients: invite link, guest follows play/pause/seek/track and re-syncs; guest can't control; late join; leave; host ends", async ({ browser }) => {
    test.setTimeout(150000);
    const srv = partyServer();
    const A = await client(browser, srv, "tokA"), B = await client(browser, srv, "tokB");
    await playTrend(A.page, 0);
    await T(A.page, () => { window.__scTest.audio.currentTime = 4; });
    await A.page.click(".mini .meta");
    await A.page.click("#tpa");
    await A.page.click(".sheet.show [data-act=partystart]");
    await expect(A.page.locator(".sheet.show .pycode")).toHaveText(/^[2-9a-hjkmnp-z]{10}$/);
    const code = (await A.page.locator(".sheet.show .pycode").innerText()).trim();
    await A.page.click(".sheet.show [data-act=partyinvite]");
    const share = (await nCalls(A.page, "share")).pop();
    expect(share[2]).toBe(`https://soundclouddl-player.netlify.app/j/${code}`); // native app → app link (no accounts, no public list)
    await A.page.click(".ov.show", { position: { x: 20, y: 20 } });
    await sheetGone(A.page);
    // guest opens the invite link
    await joinByLink(B.page, code);
    await expect(toastText(B.page)).toHaveText("به نشست هم‌زمان پیوستی");
    await expect(B.page.locator(".fp")).toHaveClass(/show/);
    await near(B.page, A.page);
    expect((await pos(B.page)).paused).toBe(false);
    await expect(B.page.locator("#tpa")).toHaveClass(/on/);
    // host seeks → guest re-syncs (> 3 s off)
    await T(A.page, () => { window.__scTest.audio.currentTime = 20; });
    await expect.poll(async () => (await pos(B.page)).t, { timeout: 12000 }).toBeGreaterThan(17);
    await near(B.page, A.page);
    // host pauses → guest pauses; host plays → guest plays
    await A.page.click("#fpp");
    await expect.poll(async () => (await pos(B.page)).paused, { timeout: 12000 }).toBe(true);
    await A.page.click("#fpp");
    await expect.poll(async () => (await pos(B.page)).paused, { timeout: 12000 }).toBe(false);
    // host changes the song → guest follows
    await A.page.click(".fp .ctr [data-act=next]");
    await expect.poll(async () => (await pos(B.page)).id, { timeout: 15000 }).toBe(101);
    await near(B.page, A.page);
    // the guest can't change the song or seek
    await B.page.click(".fp .ctr [data-act=next]");
    await expect(toastText(B.page)).toHaveText("در نشست هم‌زمان فقط میزبان آهنگ را عوض یا جابه‌جا می‌کند");
    expect((await pos(B.page)).id).toBe(101);
    // late joiner starts at the host's position
    await T(A.page, () => { window.__scTest.audio.currentTime = 15; });
    await A.page.waitForTimeout(800);
    const C = await client(browser, srv, "tokC");
    await joinByLink(C.page, code);
    await near(C.page, A.page);
    expect((await pos(C.page)).t).toBeGreaterThan(12);
    // host sees the guests; one leaves
    await expect.poll(() => T(A.page, () => window.__scTest.PARTY.guests), { timeout: 12000 }).toBe(2);
    await expect(C.page.locator(".fp")).toHaveClass(/show/); // a guest lands in the full player
    await C.page.click("#tpa");
    await C.page.click(".sheet.show [data-act=partyleave]");
    await expect(toastText(C.page)).toHaveText("از نشست خارج شدی");
    expect(await T(C.page, () => window.__scTest.PARTY.code)).toBeNull();
    await expect.poll(() => T(A.page, () => window.__scTest.PARTY.guests), { timeout: 12000 }).toBe(1);
    // the one who left can't read the session anymore
    expect([...srv.sess.get(code).members.keys()]).not.toContain(3);
    // host ends → guest is told and stops following
    await A.page.click("#tpa");
    await A.page.click(".sheet.show [data-act=partyend]");
    await A.page.click(".sheet.show [data-act=cfyes]");
    await expect(toastText(B.page)).toHaveText("میزبان نشست را تمام کرد", { timeout: 10000 });
    expect(await T(B.page, () => window.__scTest.PARTY.code)).toBeNull();
    await expect(B.page.locator("#tpa")).not.toHaveClass(/on/);
    // the guest's player is free again
    await expect(B.page.locator("body")).not.toHaveClass(/party-guest/);
    await B.page.click("#fpp");
    await B.page.waitForTimeout(6000); // > 2 guest poll intervals: nothing pulls it back
    expect((await pos(B.page)).paused).toBe(true);
    const before = srv.calls.filter(([u, , p]) => u === 2 && p.includes(code)).length;
    await B.page.waitForTimeout(3500);
    expect(srv.calls.filter(([u, , p]) => u === 2 && p.includes(code)).length).toBe(before); // polling stopped
    await Promise.all([A.ctx.close(), B.ctx.close(), C.ctx.close()]);
  });

  test("expiry after 30 min idle; joining an ended session; offline message", async ({ browser }) => {
    test.setTimeout(90000);
    const srv = partyServer();
    const A = await client(browser, srv, "tokA"), B = await client(browser, srv, "tokB");
    await playTrend(A.page, 1);
    await T(A.page, () => window.__scTest.partyStart());
    await expect.poll(() => T(A.page, () => window.__scTest.PARTY.code)).toMatch(/^[2-9a-hjkmnp-z]{10}$/);
    const code = await T(A.page, () => window.__scTest.PARTY.code);
    await joinByLink(B.page, code);
    await expect.poll(async () => (await pos(B.page)).id, { timeout: 15000 }).toBe(101);
    srv.st.skew = 31 * 60e3; // 31 minutes without any host update
    await expect(toastText(B.page)).toHaveText("نشست به‌خاطر ۳۰ دقیقه بی‌فعالیتی تمام شد", { timeout: 10000 });
    expect(await T(B.page, () => window.__scTest.PARTY.code)).toBeNull();
    srv.st.skew = 0;
    const C = await client(browser, srv, "tokC");
    await joinByLink(C.page, code);
    await expect(toastText(C.page)).toHaveText("این نشست پیدا نشد یا تمام شده");
    // offline
    await A.ctx.setOffline(true);
    await T(A.page, () => { window.__scTest.PARTY.code = null; window.dispatchEvent(new Event("offline")); });
    await T(A.page, () => window.__scTest.partyStart());
    await expect(toastText(A.page)).toHaveText("برای نشست هم‌زمان باید آنلاین باشی");
    await Promise.all([A.ctx.close(), B.ctx.close(), C.ctx.close()]);
  });
});

// ═════════════════════ 2. Persian voice search + offline search ═════════════════════
const SPEECH = () => { const rec = (n) => (...a) => { window.__nativeCalls.push([n, ...a]); }; window.SCNative.speechStart = rec("speechStart"); window.SCNative.speechStop = rec("speechStop"); };
const say = (page, d) => T(page, (d) => window.postMessage({ __sc: "speech", ...d }, location.origin), d);
const Lx = (page, key, ...a) => T(page, ([k, a]) => window.__scTest.L(k, ...a), [key, a]);
const closeOv = async (page) => { await page.click(".ov.show", { position: { x: 20, y: 20 } }); await sheetGone(page); };

test.describe("voice search", () => {
  test("native recognizer (fa-IR) → text is editable → search; recent searches stay local and can be cleared", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await page.addInitScript(SPEECH);
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .vsb");
    await expect(page.locator(".sheet.show #vsbox")).toHaveClass(/listen/);
    expect((await nCalls(page, "speechStart"))[0]).toEqual(["speechStart", "fa-IR"]);
    await say(page, { type: "partial", text: "آهنگ" });
    await expect(page.locator("#vstext")).toHaveValue("آهنگ");
    await say(page, { type: "final", text: "آهنگ شاد" });
    await expect(page.locator("#vstext")).toHaveValue("آهنگ شاد");
    await expect(page.locator("#vsbox")).toHaveClass(/done/);
    expect((await nCalls(page, "speechStop")).length).toBe(1); // the mic is released as soon as there is a final result
    await page.fill("#vstext", "آهنگ شاد پاپ"); // the user fixes the text
    await page.click(".sheet.show [data-act=vsgo]");
    await sheetGone(page);
    await expect(page.locator("#q")).toHaveValue("آهنگ شاد پاپ");
    await expect.poll(() => calls.some((c) => c.startsWith("/search") && new URL("http://x" + c).searchParams.get("q") === "آهنگ شاد پاپ")).toBe(true);
    expect(calls.some((c) => c.startsWith("/search") && new URL("http://x" + c).searchParams.get("q") === "آهنگ شاد")).toBe(false);
    // recent searches: local only
    await page.fill("#q", "");
    await expect(page.locator(".rcnt .rq .t")).toHaveText(["آهنگ شاد پاپ"]);
    expect(await T(page, () => JSON.parse(localStorage.getItem("sc_recent")))).toEqual(["آهنگ شاد پاپ"]);
    expect(calls.some((c) => /recent/i.test(c))).toBe(false);
    await page.click(".rcnt [data-act=recentclr]");
    await expect(toastText(page)).toHaveText("جستجوهای اخیر پاک شد");
    await expect(page.locator(".rcnt")).toHaveCount(0);
    expect(await T(page, () => localStorage.getItem("sc_recent"))).toBeNull();
  });

  test("the mic always stops: closing the sheet, navigating, app hidden, typing; late results are ignored", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(SPEECH);
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    const stops = async () => (await nCalls(page, "speechStop")).length;
    const open = async () => { await page.click(".sinput .vsb"); await expect(page.locator(".sheet.show #vsbox")).toHaveClass(/listen/); };
    // close
    await open();
    await closeOv(page);
    expect(await stops()).toBe(1);
    expect(await T(page, () => window.__scTest.VS.on)).toBe(false);
    // navigation
    await open();
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    expect(await stops()).toBe(2);
    await T(page, () => window.__scTest.closeSheet());
    await page.click(".nav button[data-tab=search]");
    // app hidden
    await open();
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    expect(await stops()).toBe(3);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); });
    await say(page, { type: "final", text: "متن دیرهنگام" }); // a result after the stop is ignored
    await expect(page.locator("#vstext")).toHaveValue("");
    await T(page, () => window.__scTest.closeSheet());
    await sheetGone(page);
    // typing takes over → mic stops
    await open();
    const n0 = await stops();
    await page.fill("#vstext", "سلام");
    expect(await stops()).toBe(n0 + 1); // typing takes over
    expect(await T(page, () => window.__scTest.VS.on)).toBe(false);
  });

  test("not available → clear Persian message, no fake text; recognizer errors are shown honestly", async ({ page, browser }) => {
    await setup(page, {});
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .vsb");
    await expect(toastText(page)).toHaveText("جستجوی صوتی روی این دستگاه در دسترس نیست");
    await expect(page.locator(".sheet.show")).toHaveCount(0);
    // a device without a Persian speech model
    const ctx = await browser.newContext({ viewport: VIEW, locale: "fa-IR" }); const p2 = await ctx.newPage();
    await setup(p2, {}); await p2.addInitScript(SPEECH); await boot(p2);
    await p2.click(".nav button[data-tab=search]");
    await p2.click(".sinput .vsb");
    await say(p2, { type: "error", code: "nalang" });
    await expect(p2.locator("#vsmsg")).toHaveText("تشخیص گفتار فارسی روی این دستگاه نصب نیست");
    await expect(p2.locator("#vstext")).toHaveValue("");
    await expect(p2.locator("#vsbox")).toHaveClass(/err/);
    await ctx.close();
  });
});

test.describe("offline search", () => {
  const OFFSET = [
    { id: 701, title: "باران پاییزی", artist: "حمید" },
    { id: 702, title: "Rain Song", artist: "Test Band" },
    { id: 703, title: "ماه نو", artist: "سارا" },
  ];
  test("airplane mode: downloads by title / artist / playlist with «آفلاین» badge; Arabic ي/ك match; «یافت نشد»", async ({ page, context }) => {
    const calls = [];
    await setup(page, { calls, seed: { sc_plx: JSON.stringify({ 9: { name: "سفر شمال", fav: false, ids: [703] } }) } });
    await boot(page);
    await offPut(page, OFFSET);
    await context.setOffline(true);
    await T(page, () => window.dispatchEvent(new Event("offline")));
    await page.click(".nav button[data-tab=search]");
    const q = async (text) => { await page.fill("#q", text); await page.press("#q", "Enter"); };
    await q("باران");
    await expect(page.locator(".offm")).toContainText("اینترنت نداری");
    await expect(page.locator("#sres .tr .t")).toHaveText(["باران پاییزی"]);
    await expect(page.locator("#sres .tr .badge.offb")).toHaveText("آفلاین");
    await q("پاييزي"); // typed with Arabic yeh
    await expect(page.locator("#sres .tr .t")).toHaveText(["باران پاییزی"]);
    await q("test band"); // artist, any case
    await expect(page.locator("#sres .tr .t")).toHaveText(["Rain Song"]);
    await q("سفر"); // playlist name
    await expect(page.locator("#sres .tr .t")).toHaveText(["ماه نو"]);
    await q("هیچی");
    await expect(page.locator("#sres .empty")).toContainText("یافت نشد");
    expect(calls.filter((c) => c.startsWith("/search")).length).toBe(0);
    // plays offline from the result
    await q("ماه");
    await page.click("#sres .tr >> nth=0");
    await playing(page);
    expect((await pos(page)).id).toBe(703);
  });
  test("online: device downloads are shown first with the badge, then SoundCloud results", async ({ page }) => {
    await setup(page, {});
    await boot(page);
    await offPut(page, OFFSET);
    await page.click(".nav button[data-tab=search]");
    await page.fill("#q", "ماه"); await page.press("#q", "Enter");
    await expect(page.locator("#sres .lyo").first()).toContainText("در دانلودهای همین دستگاه");
    await expect(page.locator("#sres .tr").first().locator(".badge.offb")).toHaveText("آفلاین");
    await expect(page.locator("#sres .tr")).toHaveCount(21);
  });
});

// ═════════════════════ 3. smart storage ═════════════════════
test.describe("smart storage", () => {
  const SET = [
    { id: 501, title: "بزرگ", artist: "حمید", size: 400000, playedDaysAgo: 2 },
    { id: 502, title: "هرگز پخش نشده", artist: "حمید", size: 300000 },
    { id: 100, title: "علاقه‌مندی قدیمی", artist: "هنرمند تست", size: 250000, savedDaysAgo: 100 },
    { id: 503, title: "قدیمی", artist: "سارا", size: 200000, savedDaysAgo: 200, playedDaysAgo: 120 },
    { id: 504, title: "کوچک", artist: "سارا", size: 100000, savedDaysAgo: 40 },
  ];
  const openStorage = async (page) => {
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=stoopen]");
    await page.waitForSelector("#stotal");
  };
  test("totals equal the real stored bytes; per artist / per song largest first; delete selected (+ lyrics) frees exactly that", async ({ page }) => {
    await setup(page, {});
    await boot(page);
    await offPut(page, SET);
    await T(page, () => window.__scTest.offTx("lyrics", "readwrite", (st) => st.put({ track_id: 502, status: "plain", plain: "متن" }, 502)));
    await openStorage(page);
    const db = await idbAudio(page);
    const real = Object.values(db.sizes).reduce((a, b) => a + b, 0);
    expect(real).toBe(1250000);
    expect(Number(await page.getAttribute("#stotal", "data-bytes"))).toBe(real);
    await expect(page.locator("#stotal")).toHaveText(await T(page, (b) => window.__scTest.fmtMB(b), real));
    // per artist (desc) and per song (desc)
    const cards = page.locator("#stobox .card");
    await expect(page.locator("#stobox .card:has(.ch:text-is('بر اساس خواننده')) .stn")).toHaveText([/^حمید/, /^سارا/, /^هنرمند تست/]);
    expect(await page.locator("#stobox .stt").evaluateAll((els) => els.map((e) => Number(e.dataset.id)))).toEqual([501, 502, 100, 503, 504]);
    // suggestions: never played or not played for 90 days (largest first), favorites marked
    expect(await page.locator("#stobox .stot").evaluateAll((els) => els.map((e) => Number(e.dataset.id)))).toEqual([502, 100, 503, 504]);
    await expect(page.locator("#stobox .stot[data-id='100'] .badge")).toHaveText("علاقه‌مندی");
    await expect(page.locator("#stobox [data-act=stodel]")).toBeDisabled(); // nothing is deleted without a selection
    await page.click("#stobox .stot[data-id='502']");
    await page.click("#stobox .stot[data-id='503']");
    await page.click("#stobox [data-act=stodel]");
    await expect(page.locator(".sheet.show .cfm h3")).toHaveText(await Lx(page, "stoDelQ", 2, "0.5 MB"));
    // cancel keeps everything
    await page.click(".sheet.show [data-act=cfno]");
    await sheetGone(page);
    expect(Object.keys((await idbAudio(page)).sizes).length).toBe(5);
    await page.click("#stobox [data-act=stodel]");
    await page.click(".sheet.show [data-act=cfyes]");
    await expect(toastText(page)).toHaveText(await Lx(page, "stoDeleted", 2, "0.5 MB"));
    const after = await idbAudio(page);
    expect(Object.keys(after.sizes).map(Number).sort()).toEqual([100, 501, 504]);
    expect(after.meta.sort()).toEqual([100, 501, 504]);
    expect(after.lyrics).not.toContain(502); // cached lyrics removed with the song
    await expect(page.locator("#stotal")).toHaveAttribute("data-bytes", String(real - 500000));
  });

  test("auto-cleanup is OFF by default; shows the exact list first; favorites never removed without asking", async ({ page }) => {
    await setup(page, {});
    await boot(page);
    await offPut(page, SET);
    expect(await T(page, () => localStorage.getItem("sc_clean"))).toBeNull();
    expect(await T(page, () => window.__scTest.CLN.on)).toBe(false);
    await T(page, () => window.__scTest.cleanRun());
    expect(Object.keys((await idbAudio(page)).sizes).length).toBe(5); // off → nothing happens
    await openStorage(page);
    await page.click("#stobox [data-act=cleanopen]");
    await expect(page.locator(".sheet.show .clns")).toContainText("پیش‌فرض خاموش است");
    await page.click(".sheet.show [data-act=cleanrule][data-k=never]");
    await expect(page.locator(".sheet.show .clnl .tr .t")).toHaveText(["کوچک"]); // exactly what will be deleted
    await expect(page.locator(".sheet.show .clns")).toContainText("علاقه‌مندی‌ها هیچ‌وقت بدون اجازه‌ی تو حذف نمی‌شون");
    await page.click(".sheet.show [data-act=cleanrule][data-k='90']");
    await expect(page.locator(".sheet.show .clnl .tr .t")).toHaveText(["قدیمی"]); // 503 (played 120 d ago); 100 is a favorite
    await page.click(".sheet.show [data-act=cleanon]");
    await expect(toastText(page)).toContainText("پاک‌سازی خودکار: 1 آهنگ حذف شد");
    expect(await T(page, () => JSON.parse(localStorage.getItem("sc_clean")))).toMatchObject({ on: true, rule: "90" });
    // the stale favorite is only offered, with a confirmation
    await expect(page.locator(".sheet.show .cfm h3")).toContainText("علاقه‌مندی");
    await page.click(".sheet.show [data-act=cfno]");
    expect(Object.keys((await idbAudio(page)).sizes).map(Number).sort()).toEqual([100, 501, 502, 504]);
  });

  test("travel mode: favorites in low quality, size shown first; storage limit and Wi-Fi respected", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, net: { known: true, ok: true, type: "wifi" } });
    await boot(page);
    await openStorage(page);
    // limit too small → refused before anything starts
    await offPut(page, [{ id: 801, title: "پر", size: 900000 }]);
    await T(page, () => { window.__scTest.OFF.limitMB = 1; });
    await page.click("#stobox [data-act=travel]");
    await expect(toastText(page)).toContainText("جا نیست");
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0);
    expect(calls.some((c) => c.startsWith("/stream/"))).toBe(false);
    // mobile data → refused
    await T(page, () => { window.__scTest.OFF.limitMB = 0; window.__net = { known: true, ok: false, type: "cellular" }; });
    await page.waitForTimeout(5100); // netInfo cache
    await page.click("#stobox [data-act=travel]");
    await expect(toastText(page)).toHaveText("حالت سفر فقط با وای‌فای دانلود می‌کند");
    // Wi-Fi → approximate size first, then low quality downloads
    await T(page, () => { window.__net = { known: true, ok: true, type: "wifi" }; });
    await page.waitForTimeout(5100);
    await page.click("#stobox [data-act=travel]");
    await expect(page.locator(".sheet.show .cfm h3")).toContainText("3 آهنگ از علاقه‌مندی‌ها با کیفیت کم (حدود");
    await page.click(".sheet.show [data-act=cfyes]");
    await expect.poll(() => T(page, () => [100, 101, 102].every((id) => window.__scTest.OFF.ids.has(id))), { timeout: 20000 }).toBe(true);
    const streams = calls.filter((c) => /^\/stream\/10[012]\?/.test(c));
    expect(streams.length).toBeGreaterThanOrEqual(3);
    for (const c of streams) expect(new URL("http://x" + c).searchParams.get("preset")).toBe("aac_96k");
  });
});

// ═════════════════════ 6. download scheduling ═════════════════════
test.describe("download scheduling", () => {
  const hhmm = (page, min) => T(page, (m) => { const d = new Date(Date.now() + m * 60e3); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }, min);
  const enq = (page, ids) => T(page, (l) => window.__scTest.dlEnqueue(l), ids.map((id) => track(id, "آهنگ " + id)));
  const setSch = async (page, o) => { const from = await hhmm(page, o.from), to = await hhmm(page, o.to); await T(page, (x) => { Object.assign(window.__scTest.SCH, x); }, { on: true, from, to, days: o.days || [0, 1, 2, 3, 4, 5, 6], wifi: !!o.wifi, charge: !!o.charge }); };
  const streams = (calls, id) => calls.filter((c) => c.startsWith(`/stream/${id}?`) || c === `/stream/${id}`);

  test("outside the window: queued (not started), next run shown, survives a restart; cancel; «الان دانلود کن»", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, net: { known: true, ok: true, type: "wifi", charging: true } });
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=schopen]");
    await page.click(".sheet.show [data-act=schd][data-k=on]");
    await page.fill("#schfrom", await hhmm(page, 120));
    await page.fill("#schto", await hhmm(page, 180));
    await expect(page.locator(".sheet.show .schnote")).toContainText("اندروید ممکن است برای صرفه‌جویی باتری"); // honest about battery optimization
    await page.click(".sheet.show [data-act=schsave]");
    await expect(toastText(page)).toContainText("اجرای بعدی:");
    expect(JSON.parse((await nCalls(page, "schedSet")).pop()[1])).toMatchObject({ on: true, wifi: true });
    await enq(page, [100, 101]);
    await page.waitForTimeout(1500);
    expect(streams(calls, 100).length + streams(calls, 101).length).toBe(0);
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    await expect(page.locator(".schc .badge")).toContainText("اجرای بعدی:");
    await expect(page.locator(".schq span")).toContainText("2 آهنگ در صف زمان‌بندی");
    await expect(page.locator(".dlj .dlst")).toHaveText(["در صف زمان‌بندی", "در صف زمان‌بندی"]);
    expect(await T(page, () => JSON.parse(localStorage.getItem("sc_schq")).length)).toBe(2);
    // app restart → still queued for the next window
    await page.reload(); await page.waitForSelector(".nav button[data-tab=home]");
    await expect.poll(() => T(page, () => window.__scTest.DLM.jobs.filter((j) => j.sched && j.st === "queued").length)).toBe(2);
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    await page.click(".dlj[data-id='101'] [data-act=dlcancel]");
    await expect.poll(() => T(page, () => JSON.parse(localStorage.getItem("sc_schq")).length)).toBe(1);
    // download now
    await page.click(".schq [data-act=schnow]");
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(100)), { timeout: 15000 }).toBe(true);
    expect(await T(page, () => window.__scTest.OFF.ids.has(101))).toBe(false);
    expect(streams(calls, 101).length).toBe(0);
  });

  test("inside the window: waits for Wi-Fi and charging, then starts; an excluded weekday is outside", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, net: { known: true, ok: false, type: "cellular", charging: true } });
    await boot(page);
    await setSch(page, { from: -60, to: 60, wifi: true, charge: true });
    await enq(page, [100]);
    await T(page, () => window.__scTest.schTick());
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    await expect(page.locator(".schc .badge")).toHaveText("منتظر وای‌فای");
    expect(streams(calls, 100).length).toBe(0);
    await T(page, () => { window.__net = { known: true, ok: true, type: "wifi", charging: false }; });
    await T(page, () => window.__scTest.schTick());
    await expect(page.locator(".schc .badge")).toHaveText("منتظر شارژ");
    expect(streams(calls, 100).length).toBe(0);
    await T(page, () => { window.__net = { known: true, ok: true, type: "wifi", charging: true }; });
    await T(page, () => window.__scTest.schTick());
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(100)), { timeout: 15000 }).toBe(true);
    // today not selected → outside the window, next run on another day
    await T(page, () => { const t = new Date().getDay(); window.__scTest.SCH.days = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== t && d !== (t + 6) % 7); });
    await enq(page, [101]);
    await T(page, () => window.__scTest.schTick());
    await page.waitForTimeout(1000);
    expect(await T(page, () => window.__scTest.SCH.last)).toMatchObject({ ok: false, why: "win" });
    expect(streams(calls, 101).length).toBe(0);
    await expect(page.locator(".schc .badge")).toContainText("اجرای بعدی:");
  });

  test("leaving the window mid-download pauses it with no partial file; it restarts in the next window", async ({ page }) => {
    let slow = true;
    await setup(page, { net: { known: true, ok: true, type: "wifi" }, media: async (url) => { if (slow && url.pathname.includes("/a/100")) await new Promise((r) => setTimeout(r, 4000)); } });
    await boot(page);
    await setSch(page, { from: -60, to: 60, wifi: true });
    await enq(page, [100]);
    await expect.poll(() => T(page, () => window.__scTest.DLM.cur?.t.id)).toBe(100);
    await setSch(page, { from: 120, to: 180, wifi: true });
    slow = false;
    await T(page, () => window.__scTest.schTick());
    await expect(toastText(page)).toContainText("بیرون از بازه");
    await expect.poll(() => T(page, () => { const j = window.__scTest.DLM.jobs.find((x) => x.t.id === 100); return j && `${j.st}/${j.pct}/${j.sched}`; })).toBe("queued/0/true");
    expect(await T(page, () => window.__scTest.OFF.ids.has(100))).toBe(false);
    expect(Object.keys((await idbAudio(page)).sizes)).toEqual([]); // nothing partial in IndexedDB
    await setSch(page, { from: -60, to: 60, wifi: true });
    await T(page, () => window.__scTest.schTick());
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(100)), { timeout: 15000 }).toBe(true);
    expect(Object.keys((await idbAudio(page)).sizes)).toEqual(["100"]);
  });
});

// ═════════════════════ 7. new-release alerts ═════════════════════
test.describe("new release alerts", () => {
  test("follow (artist page + search) → old songs never alert; a new one alerts once per day; mute; global switch; unfollow stops it", async ({ page }) => {
    const calls = [], REL = { 77: [], 88: [] };
    const rel = (id, title, ms) => Object.assign(track(id, title, "خواننده تست"), { created_at: new Date(ms).toISOString() });
    await setup(page, { calls, api: (p, req, json) => {
      if (p.startsWith("/user/77")) return json({ user: { id: 77, username: "خواننده تست", avatar_url: null, followers: 1200, tracks: 3, permalink_url: "https://soundcloud.com/x", verified: false }, top: TRENDING.slice(0, 3), latest: TRENDING.slice(3, 5) });
      if (p.startsWith("/search") && p.includes("type=users")) return json({ items: [{ id: 88, username: "خواننده دوم", avatar_url: null, followers: 5, tracks: 2 }] });
      if (p.startsWith("/releases")) { const ids = new URL("http://x" + p).searchParams.get("ids").split(",").map(Number); return json({ releases: Object.fromEntries(ids.map((i) => [i, REL[i] || []])), failed: [], server_time: Date.now() }); }
    } });
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    const notes = async () => (await nCalls(page, "notify")).map((c) => JSON.parse(c[1]));
    // follow on the artist page
    await T(page, () => window.__scTest.go({ type: "artist", id: 77 }));
    await page.click(".acts [data-act=follow]");
    await expect(page.locator(".acts [data-act=follow]")).toHaveClass(/on/);
    await expect(page.locator(".acts [data-act=follow]")).toContainText("دنبال می‌کنی");
    expect(JSON.parse((await nCalls(page, "bgSync")).pop()[1]).list.map((f) => f.id)).toEqual([77]); // Android background check gets the list
    // follow from search results
    await page.click(".nav button[data-tab=search]");
    await page.fill("#q", "خواننده"); await page.press("#q", "Enter");
    await page.click(".sbox .chip[data-k=users]");
    await page.click(".folb[data-id='88']");
    await expect(page.locator(".folb[data-id='88']")).toHaveClass(/on/);
    expect(await T(page, () => JSON.parse(localStorage.getItem("sc_follows")).map((f) => f.id))).toEqual([77, 88]);
    // a song released BEFORE following → no alert
    REL[77].push(rel(9001, "قدیمی", Date.now() - 2 * 864e5));
    expect(await T(page, () => window.__scTest.folCheck())).toBe(0);
    expect(await notes()).toEqual([]);
    // a real new release → one notification that opens the song
    REL[77].unshift(rel(9002, "تازه ۱", Date.now()));
    expect(await T(page, () => window.__scTest.folCheck())).toBe(1);
    expect(await notes()).toEqual([expect.objectContaining({ title: "آهنگ تازه از خواننده تست", body: "تازه ۱", link: "t_9002" })]);
    // same day, another one → listed, but no second notification today
    REL[77].unshift(rel(9003, "تازه ۲", Date.now()));
    expect(await T(page, () => window.__scTest.folCheck())).toBe(1);
    expect((await notes()).length).toBe(1);
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=folopen]");
    await expect(page.locator(".view .list").first().locator(".tr .t")).toHaveText(["تازه ۲", "تازه ۱"]);
    await expect(page.locator(".view .list").first().locator(".tr .a").first()).toContainText("منتشرشده");
    // per-artist mute (next day)
    await T(page, () => { window.__scTest.FOL.list.forEach((f) => { f.alert_day = ""; }); });
    await page.click("[data-act=folmute][data-id='77']");
    await expect(toastText(page)).toHaveText("اعلان‌های این خواننده بی‌صدا شد");
    REL[77].unshift(rel(9004, "تازه ۳", Date.now()));
    await T(page, () => window.__scTest.folCheck());
    expect((await notes()).length).toBe(1);
    // global switch off
    await page.click("[data-act=folmute][data-id='77']");
    await page.click(".it[data-act=folon]");
    expect(await T(page, () => window.__scTest.FOL.on)).toBe(false);
    REL[77].unshift(rel(9005, "تازه ۴", Date.now()));
    await T(page, () => window.__scTest.folCheck());
    expect((await notes()).length).toBe(1);
    await page.click(".it[data-act=folon]");
    // unfollow → not checked anymore, its news removed
    await page.click("[data-act=folun][data-id='77']");
    await expect(toastText(page)).toContainText("خواننده تست");
    REL[77].unshift(rel(9006, "تازه ۵", Date.now()));
    await T(page, () => window.__scTest.folCheck());
    expect(calls.filter((c) => c.startsWith("/releases")).pop()).toBe("/releases?ids=88");
    expect((await notes()).length).toBe(1);
    expect(await T(page, () => window.__scTest.FOL.news.some((n) => n.a === 77))).toBe(false);
  });

  test("tapping the notification opens the song", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    await T(page, () => { window.__link = "t_9002"; window.postMessage({ __sc: "link" }, "*"); });
    await expect.poll(async () => (await pos(page)).id, { timeout: 10000 }).toBe(9002);
  });
});

// ═════════════════════ 4. backup / transfer ═════════════════════
function plServer(pls) {
  const st = { nextId: 50, pls, sent: [], writes: [] };
  const handle = (p, req, json) => {
    const m = req.method(), p0 = p.split("?")[0], seg = p0.split("/").filter(Boolean);
    if (seg[0] === "backup" && m === "POST") { st.sent.push(req.postDataJSON()); return json({ ok: true }); }
    if (seg[0] !== "playlists") return;
    if (m !== "GET") st.writes.push(`${m} ${p0}`);
    const info = (x) => ({ id: x.id, name: x.name, is_favorites: !!x.fav, is_public: !!x.pub, track_count: x.tracks.length });
    if (seg.length === 1) {
      if (m === "GET") return json({ items: st.pls.map(info) });
      const pl = { id: st.nextId++, name: req.postDataJSON().name, tracks: [] }; st.pls.push(pl); return json({ playlist: info(pl) });
    }
    const pl = st.pls.find((x) => x.id === Number(seg[1])); if (!pl) return json({ error: "not found" }, 404);
    if (seg.length === 2) {
      if (m === "GET") return json({ playlist: info(pl), tracks: pl.tracks.map((id) => track(id, "آهنگ " + id)) });
      if (m === "DELETE") { if (pl.fav) return json({ error: "forbidden" }, 403); st.pls = st.pls.filter((x) => x !== pl); return json({ ok: true }); }
      if (m === "PATCH") { const b = req.postDataJSON(); if (typeof b.is_public === "boolean") pl.pub = b.is_public; if (b.name) pl.name = b.name; return json({ playlist: info(pl) }); }
    }
    if (seg[2] === "tracks") {
      if (m === "POST") { const b = req.postDataJSON(), ids = b.track_ids || [b.track_id], missing = ids.filter((id) => id >= 990000); let added = 0;
        for (const id of ids) if (!missing.includes(id) && !pl.tracks.includes(id)) { pl.tracks.push(id); added++; } return json({ added, missing }); }
      if (m === "DELETE") { pl.tracks = pl.tracks.filter((x) => x !== Number(seg[3])); return json({ ok: true }); }
    }
  };
  return { st, handle };
}
const shape = (st) => st.pls.map((x) => `${x.fav ? "❤" : x.name}${x.pub ? "(public)" : ""}:${x.tracks.join(",")}`).sort();

test.describe("backup / transfer", () => {
  async function client(browser, srv, seed = {}) {
    const ctx = await browser.newContext({ viewport: VIEW, locale: "fa-IR" }); const page = await ctx.newPage();
    await setup(page, { seed, net: { known: true, ok: true, type: "wifi" }, api: (p, req, json) => srv.handle(p, req, json) });
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    return { ctx, page };
  }
  const openBk = async (page) => { await page.click(".nav button[data-tab=settings]"); await page.click(".it[data-act=bkopen]"); await page.waitForSelector(".sheet.show .bks"); };
  const importText = async (page, text, name = "backup.json") => {
    await openBk(page);
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click(".sheet.show [data-act=bkimp]")]);
    await fc.setFiles({ name, mimeType: "application/json", buffer: Buffer.from(text) });
  };
  const SRC = () => plServer([{ id: 1, name: "fav", fav: true, tracks: [100, 101] }, { id: 2, name: "شب", pub: true, tracks: [102, 103] }, { id: 3, name: "ورزش", tracks: [104] }]);
  const SEED_A = { sc_follows: JSON.stringify([{ id: 77, username: "خواننده تست", avatar_url: null, followed_at: 1, seen: [], muted: true, alert_day: "" }]), sc_rate: "1.25", sc_off_limit: "2048" };
  async function exportFrom(browser) {
    const A = await client(browser, SRC(), SEED_A);
    await offPut(A.page, [{ id: 105, title: "آفلاین", size: 200044 }]);
    await openBk(A.page);
    await expect(A.page.locator(".sheet.show .bkno")).toHaveText("ℹ️ فایل‌های صوتی داخل پشتیبان نیستند؛ فقط فهرست آن‌ها ذخیره می‌شود.");
    await A.page.click(".sheet.show [data-act=bkexp][data-m=share]");
    await expect.poll(async () => (await nCalls(A.page, "shareFile")).length).toBe(1);
    const [, name, mime, text] = (await nCalls(A.page, "shareFile"))[0];
    await A.ctx.close();
    return { name, mime, text };
  }

  test("export (share to Telegram / bot chat, never automatic) → import on a clean profile → same data; merge again adds no duplicates", async ({ browser }) => {
    const { name, mime, text } = await exportFrom(browser);
    expect(name).toMatch(/^soundcloud-backup-\d{4}-\d\d-\d\d\.json$/); expect(mime).toBe("application/json");
    const j = JSON.parse(text);
    expect(j).toMatchObject({ format: "soundcloud-player-backup", version: 1, contains_audio: false });
    expect(j.playlists.map((p) => [p.name, p.public, p.tracks.map((t) => t.id)])).toEqual([["شب", true, [102, 103]], ["ورزش", false, [104]]]);
    expect(j.favorites.map((t) => t.id)).toEqual([100, 101]);
    expect(j.follows).toEqual([{ id: 77, username: "خواننده تست", avatar_url: null, muted: true }]);
    expect(j.settings).toMatchObject({ sc_rate: "1.25", sc_off_limit: "2048" });
    expect(j.offline.map((t) => t.id)).toEqual([105]);
    expect(text.length).toBeLessThan(20000); // lists only, no audio
    expect(Object.keys(j)).not.toContain("audio");
    // the bot-chat variant only runs when tapped, with the same file
    const srvB = plServer([{ id: 1, name: "fav", fav: true, tracks: [] }]);
    const B = await client(browser, srvB);
    await B.page.waitForTimeout(1500);
    expect(srvB.st.sent.length).toBe(0); // nothing is uploaded on its own
    await importText(B.page, text);
    await expect(B.page.locator(".sheet.show .bks p")).toHaveText("2 پلی‌لیست · 2 علاقه‌مندی · 1 خواننده · 1 آهنگ آفلاین");
    await expect(B.page.locator(".sheet.show .bkno")).toContainText("فایل‌های صوتی داخل پشتیبان نیستند");
    await B.page.click(".sheet.show [data-act=bkapply][data-m=merge]");
    await expect(toastText(B.page)).toHaveText("بازیابی انجام شد: 2 پلی‌لیست و 5 آهنگ", { timeout: 10000 });
    expect(shape(srvB.st)).toEqual(shape(SRC().st));
    expect(await T(B.page, () => window.__scTest.FOL.list.map((f) => [f.id, f.muted]))).toEqual([[77, true]]);
    // offered: re-download the songs that were offline on the old device (only after confirming)
    await expect(B.page.locator(".sheet.show .cfm h3")).toHaveText("1 آهنگ روی دستگاه قبلی آفلاین بود. دوباره دانلود شوند؟", { timeout: 6000 });
    await B.page.click(".sheet.show [data-act=cfyes]");
    await expect.poll(() => T(B.page, () => window.__scTest.OFF.ids.has(105)), { timeout: 15000 }).toBe(true);
    // merge the same file again → nothing duplicated
    await importText(B.page, text);
    await B.page.click(".sheet.show [data-act=bkapply][data-m=merge]");
    await expect(toastText(B.page)).toHaveText("بازیابی انجام شد: 2 پلی‌لیست و 0 آهنگ", { timeout: 10000 });
    expect(shape(srvB.st)).toEqual(shape(SRC().st));
    expect(srvB.st.pls.length).toBe(3);
    // send to the bot chat (explicit tap)
    await openBk(B.page);
    await B.page.click(".sheet.show [data-act=bkexp][data-m=bot]");
    await expect(toastText(B.page)).toHaveText("فایل پشتیبان در چت ربات فرستاده شد");
    expect(srvB.st.sent.length).toBe(1);
    expect(srvB.st.sent[0].name).toMatch(/^soundcloud-backup-.*\.json$/);
    expect(JSON.parse(srvB.st.sent[0].data).format).toBe("soundcloud-player-backup");
    await B.ctx.close();
  });

  test("replace asks first, then makes the profile equal to the backup", async ({ browser }) => {
    const { text } = await exportFrom(browser);
    const srv = plServer([{ id: 1, name: "fav", fav: true, tracks: [100, 200] }, { id: 7, name: "شب", tracks: [300] }, { id: 8, name: "اضافه", tracks: [301] }]);
    const B = await client(browser, srv, { sc_rate: "1" });
    await importText(B.page, text);
    await B.page.click(".sheet.show [data-act=bkapply][data-m=replace]");
    await expect(B.page.locator(".sheet.show .cfm h3")).toContainText("همه‌ی پلی‌لیست‌ها و علاقه‌مندی‌های فعلی‌ات پاک");
    await B.page.click(".sheet.show [data-act=cfno]");
    await sheetGone(B.page);
    expect(srv.st.writes).toEqual([]); // canceled → nothing touched
    await importText(B.page, text);
    await B.page.click(".sheet.show [data-act=bkapply][data-m=replace]");
    await B.page.click(".sheet.show [data-act=cfyes]");
    await expect(toastText(B.page)).toContainText("بازیابی انجام شد", { timeout: 10000 });
    expect(shape(srv.st)).toEqual(shape(SRC().st)); // exactly the backup (old «شب» content and «اضافه» are gone)
    expect(srv.st.pls.some((x) => x.name === "اضافه")).toBe(false);
    expect(await T(B.page, () => localStorage.getItem("sc_rate"))).toBe("1.25");
    await B.ctx.close();
  });

  test("damaged file / wrong format / newer version → clear Persian message, nothing changes", async ({ browser }) => {
    const srv = plServer([{ id: 1, name: "fav", fav: true, tracks: [100] }]);
    const B = await client(browser, srv, SEED_A);
    const before = await T(B.page, () => ({ f: localStorage.getItem("sc_follows"), r: localStorage.getItem("sc_rate") }));
    const good = { format: "soundcloud-player-backup", version: 1, playlists: [], favorites: [], follows: [], settings: {}, offline: [] };
    for (const [txt, msg] of [
      ["{ این فایل خراب است", "این فایل پشتیبان معتبر نیست یا خراب است؛ چیزی تغییر نکر"],
      [JSON.stringify({ ...good, format: "other-app" }), "این فایل پشتیبان معتبر نیست یا خراب است"],
      [JSON.stringify({ ...good, version: 99 }), "نسخه‌ی این فایل پشتیبان (99) پشتیبانی نمی‌شود؛ چیزی تغییر نکرد"],
      [JSON.stringify({ ...good, playlists: [{ name: "x", tracks: [{ id: "abc" }] }] }), "این فایل پشتیبان معتبر نیست یا خراب است"],
      [JSON.stringify({ ...good, favorites: "not a list" }), "این فایل پشتیبان معتبر نیست یا خراب است"],
    ]) {
      await importText(B.page, txt);
      await expect(toastText(B.page)).toContainText(msg);
      await expect(B.page.locator(".sheet.show")).toHaveCount(0);
    }
    expect(srv.st.writes).toEqual([]);
    expect(await T(B.page, () => ({ f: localStorage.getItem("sc_follows"), r: localStorage.getItem("sc_rate") }))).toEqual(before);
    await B.ctx.close();
  });
});

// ═════════════════════ Persian / RTL screenshots of the v1.5 screens ═════════════════════
const SHOTS = process.env.SC_SHOTS || path.join(HERE, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });
const rtlFa = async (page) => { await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await expect(page.locator("html")).toHaveAttribute("lang", "fa"); };
const shot = async (page, name) => { await rtlFa(page); await page.waitForTimeout(500); await page.screenshot({ path: path.join(SHOTS, `v15-${name}.png`) }); };

test.describe("v1.5 Persian screens", () => {
  test.use({ deviceScaleFactor: 1 });

  test("sync listening: host + guest", async ({ browser }) => {
    const srv = partyServer();
    const mk = async (tok) => { const ctx = await browser.newContext({ viewport: VIEW, locale: "fa-IR", deviceScaleFactor: 1 }); const page = await ctx.newPage();
      await setup(page, { seed: { sc_token: tok }, api: (p, req, json) => srv.handle(p, req, json) }); await page.addInitScript(NATIVE_V15); await boot(page); return { ctx, page }; };
    const A = await mk("tokA"), B = await mk("tokB");
    await playTrend(A.page, 1);
    await A.page.click(".mini .meta"); await A.page.click("#tpa");
    await A.page.click(".sheet.show [data-act=partystart]");
    const code = (await A.page.locator(".sheet.show .pycode").innerText()).trim();
    await T(B.page, (c) => { window.__link = "j_" + c; window.postMessage({ __sc: "link" }, "*"); }, code);
    await expect.poll(() => T(A.page, () => window.__scTest.PARTY.guests), { timeout: 12000 }).toBe(1);
    await expect(A.page.locator(".sheet.show")).toContainText("1 نفر همراهت گوش می‌دهند", { timeout: 8000 });
    await shot(A.page, "sync-host");
    await expect(B.page.locator(".fp")).toHaveClass(/show/);
    await B.page.click("#tpa");
    await expect(B.page.locator(".sheet.show")).toContainText("در نشست");
    await shot(B.page, "sync-guest");
    await Promise.all([A.ctx.close(), B.ctx.close()]);
  });

  test("voice search + offline search", async ({ page, context }) => {
    await setup(page, { seed: { sc_recent: JSON.stringify(["محسن چاوشی", "آهنگ شاد"]) } });
    await page.addInitScript(SPEECH);
    await boot(page);
    await offPut(page, [{ id: 701, title: "باران پاییزی", artist: "حمید", size: 300044 }, { id: 702, title: "باران بهاری", artist: "سارا", size: 200044 }]);
    await page.click(".nav button[data-tab=search]");
    await expect(page.locator(".rcnt")).toContainText("جستجوهای اخیر");
    await shot(page, "search-recent");
    await page.click(".sinput .vsb");
    await say(page, { type: "final", text: "آهنگ باران" });
    await expect(page.locator("#vstext")).toHaveValue("آهنگ باران");
    await shot(page, "voice-search");
    await closeOv(page);
    await context.setOffline(true);
    await T(page, () => window.dispatchEvent(new Event("offline")));
    await page.fill("#q", "باران"); await page.press("#q", "Enter");
    await expect(page.locator("#sres .badge.offb")).toHaveCount(2);
    await shot(page, "offline-search");
  });

  test("storage + auto-cleanup + travel", async ({ page }) => {
    await setup(page, { net: { known: true, ok: true, type: "wifi" } });
    await boot(page);
    await offPut(page, [
      { id: 501, title: "چشمای تو", artist: "حمید", size: 4200044, playedDaysAgo: 2 },
      { id: 502, title: "هرگز پخش نشده", artist: "حمید", size: 3100044 },
      { id: 100, title: "آهنگ شب ۱", artist: "هنرمند تست", size: 2500044, savedDaysAgo: 100 },
      { id: 503, title: "دریا", artist: "سارا", size: 1800044, savedDaysAgo: 200, playedDaysAgo: 120 },
    ]);
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=stoopen]");
    await page.waitForSelector("#stobox .stot");
    await page.click("#stobox .stot[data-id='502']");
    await shot(page, "storage");
    await page.click("#stobox [data-act=cleanopen]");
    await page.waitForSelector(".sheet.show .clns");
    await shot(page, "storage-autoclean");
  });

  test("backup", async ({ browser }) => {
    const srv = plServer([{ id: 1, name: "fav", fav: true, tracks: [100, 101] }, { id: 2, name: "شب", tracks: [102] }]);
    const ctx = await browser.newContext({ viewport: VIEW, locale: "fa-IR", deviceScaleFactor: 1 }); const page = await ctx.newPage();
    await setup(page, { api: (p, req, json) => srv.handle(p, req, json) }); await page.addInitScript(NATIVE_V15); await boot(page);
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=bkopen]");
    await page.waitForSelector(".sheet.show .bks");
    await shot(page, "backup");
    await page.click(".sheet.show [data-act=bkexp][data-m=share]");
    await expect.poll(async () => (await nCalls(page, "shareFile")).length).toBe(1);
    const text = (await nCalls(page, "shareFile"))[0][3];
    await page.click(".it[data-act=bkopen]");
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click(".sheet.show [data-act=bkimp]")]);
    await fc.setFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(text) });
    await page.waitForSelector(".sheet.show [data-act=bkapply]");
    await shot(page, "backup-import");
    await ctx.close();
  });

  test("download scheduling", async ({ page }) => {
    await setup(page, { net: { known: true, ok: true, type: "wifi" } });
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    const hh = (m) => T(page, (m) => { const d = new Date(Date.now() + m * 60e3); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }, m);
    await T(page, (x) => Object.assign(window.__scTest.SCH, x), { on: true, from: await hh(120), to: await hh(300), days: [6, 0, 1, 2, 3], wifi: true, charge: true });
    await T(page, (l) => window.__scTest.dlEnqueue(l), [track(100, "آهنگ شب ۱"), track(101, "باران ۲"), track(102, "خیابان ۳")]);
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=schopen]");
    await page.waitForSelector(".sheet.show .schs");
    await shot(page, "schedule");
    await closeOv(page);
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    await expect(page.locator(".schq")).toContainText("3 آهنگ در صف زمان‌بندی");
    await shot(page, "schedule-downloads");
  });

  test("followed artists + new releases", async ({ page }) => {
    const now = Date.now();
    await setup(page, { seed: { sc_follows: JSON.stringify([
      { id: 77, username: "محسن چاوشی", avatar_url: null, followed_at: now - 5 * 864e5, seen: [], muted: false, alert_day: "" },
      { id: 88, username: "سارا", avatar_url: null, followed_at: now - 9 * 864e5, seen: [], muted: true, alert_day: "" }]) },
      api: (p, req, json) => { if (p.startsWith("/releases")) return json({ releases: { 77: [Object.assign(track(9002, "آهنگ تازه", "محسن چاوشی"), { created_at: new Date(now - 864e5).toISOString() })], 88: [] }, failed: [], server_time: now }); } });
    await page.addInitScript(NATIVE_V15);
    await boot(page);
    await T(page, () => window.__scTest.folCheck());
    await page.click(".nav button[data-tab=settings]");
    await page.click(".it[data-act=folopen]");
    await expect(page.locator(".view")).toContainText("آهنگ تازه");
    await shot(page, "follows");
  });

  test("video recognition result", async ({ page }) => {
    await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("denied"), { name: "NotAllowedError" })); });
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) return json({ hit: { title: "Tone Song", artist: "Test Artist", cover: null }, tracks: [track(900, "Tone Song", "Test Artist")], matched: 1, tried: 1 }); } });
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click(".sheet.show [data-act=recfile]")]);
    await fc.setFiles(path.join(MEDIA, "mp3in.mp4"));
    await expect(page.locator(".sheet.show .rmeta small")).toHaveText("🎬 این آهنگ", { timeout: 20000 });
    await shot(page, "video-result");
    await closeOv(page);
    // no audio → honest message
    await page.click(".sinput .mic");
    const [fc2] = await Promise.all([page.waitForEvent("filechooser"), page.click(".sheet.show [data-act=recfile]")]);
    await fc2.setFiles(path.join(MEDIA, "noaudio.mp4"));
    await expect(page.locator(".sheet.show .rec h3")).toHaveText("این ویدیو صدا ندارد", { timeout: 20000 });
    await shot(page, "video-noaudio");
  });
});
