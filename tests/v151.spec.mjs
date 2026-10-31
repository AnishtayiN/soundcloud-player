// v1.5.1 tests for the shared web UI side of the parts that were incomplete in v1.5.0
// (fake native bridge = the exact SCAndroid / Windows preload contract; the native halves are tested on the
// Android emulator by .github/scripts/android-native.sh and in desktop/ by tests/native/*).
import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setup, boot, silentWav, TRENDING } from "./harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.SC_SHOTS || path.join(HERE, "screenshots");
test.use({ viewport: { width: 412, height: 860 }, locale: "fa-IR" });

const T = (page, fn, arg) => page.evaluate(fn, arg);
const nCalls = (page, name) => T(page, (n) => window.__nativeCalls.filter((c) => c[0] === n), name);
const L = (page, k, ...a) => T(page, ([k, a]) => window.__scTest.L(k, ...a), [k, a]);
const toastText = (page) => page.locator(".toast.show");
const FA = /[\u0600-\u06FF]/;
const TOKEN = "test-token-0123456789abcdef";
const rtlFa = async (page) => { await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await expect(page.locator("html")).toHaveAttribute("lang", "fa"); };
const shot = async (page, name) => { await rtlFa(page); await page.waitForTimeout(500); await page.screenshot({ path: path.join(SHOTS, `v151-${name}.png`) }); };
const playing = (page) => page.waitForFunction(() => { const a = window.__scTest; return a && !a.S.loadingTrack && !a.audio.paused && a.audio.currentTime > 0; });
const nowId = (page) => T(page, () => window.__scTest.S.queue[window.__scTest.S.qi]?.id);
const native = (page, d) => T(page, (d) => window.postMessage(d, location.origin), d);

// the v1.5.1 bridge methods (recorded); tests override single methods when they need return values
const NATIVE_V151 = () => {
  const rec = (name, ret) => (...a) => { window.__nativeCalls.push([name, ...a]); return ret; };
  Object.assign(window.SCNative, { notify: rec("notify", true), bgSync: rec("bgSync"), schedSet: rec("schedSet"), schedAck: rec("schedAck"), autoLib: rec("autoLib", true),
    widgetPin: rec("widgetPin"), openBatterySettings: rec("openBatterySettings"), shareFile: rec("shareFile", "ok"), speechStart: rec("speechStart"), speechStop: rec("speechStop") });
  window.SCNative.takeLink = () => { const l = window.__link || ""; window.__link = ""; return l; };
};
const offPut = (page, list) => T(page, async (list) => {
  const t = window.__scTest;
  for (const x of list) {
    const tr = Object.assign({ id: x.id, title: x.title, artist: "هنرمند", username: "هنرمند", user_id: 7, duration_ms: 30000, artwork_url: null, permalink_url: "https://soundcloud.com/x/" + x.id }, x);
    const size = x.size || 160044, b = new Uint8Array(size).fill(128), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < 4; i++) b[o + i] = s.charCodeAt(i); };
    w(0, "RIFF"); v.setUint32(4, size - 8, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, size - 44, true);
    await t.offPut(tr, new Blob([b], { type: "audio/wav" }), true);
  }
}, list);
const idbSizes = (page) => page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("sc_offline"); r.onsuccess = () => { const out = {}; const c = r.result.transaction("audio").objectStore("audio").openCursor();
    c.onsuccess = () => { const x = c.result; if (x) { out[x.key] = x.value.size; x.continue(); } else res(out); }; };
}));
const openStorage = async (page) => { await page.click(".nav button[data-tab=settings]"); await page.click(".it[data-act=stoopen]"); await page.waitForSelector("#stotal"); };

// ═════════════ 7. exact free space ═════════════
test.describe("exact free space", () => {
  test("Android: StatFs numbers from the bridge are shown as exact, offline total = real IndexedDB bytes", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await page.addInitScript(() => { window.SCNative.storageInfo = () => JSON.stringify({ free: 12_500_000_000, total: 64_000_000_000, exact: true }); });
    await boot(page);
    await offPut(page, [{ id: 701, title: "یک", size: 300044 }, { id: 702, title: "دو", size: 200044 }]);
    await openStorage(page);
    const real = Object.values(await idbSizes(page)).reduce((a, b) => a + b, 0);
    expect(real).toBe(500088);
    expect(Number(await page.getAttribute("#stotal", "data-bytes"))).toBe(real);
    const box = page.locator(".stofree");
    await expect(box).toHaveClass(/exact/);
    await expect(box.locator("small")).toHaveText(await L(page, "stoFreeExact"));
    await expect(box.locator("b")).toHaveText(await T(page, () => window.__scTest.fmtMB(12_500_000_000)));
    await expect(box).not.toContainText(await L(page, "stoApprox"));
    await expect(page.locator(".stoacc")).toHaveText(await L(page, "stoExactSub"));
    expect(await L(page, "stoFreeExact")).toMatch(FA);
    await shot(page, "storage-exact");
  });
  test("fallback (Mini App / browser / bridge without an exact value): old estimate, labeled «تقریبی»", async ({ page }) => {
    await setup(page, {});
    await boot(page);
    await openStorage(page);
    await expect(page.locator(".stofree")).toHaveClass(/approx/);
    await expect(page.locator(".stofree .badge")).toHaveText("تقریبی");
    await expect(page.locator(".stoacc")).toHaveText(await L(page, "stoApproxSub"));
    // a bridge answer that isn't marked exact is never presented as exact
    await T(page, () => { window.SCNative.storageInfo = () => JSON.stringify({ free: 5e9, total: 6e10 }); });
    expect((await T(page, () => window.__scTest.stoFree())).exact).toBe(false);
    await T(page, () => { window.SCNative.storageInfo = () => { throw new Error("x"); }; });
    expect((await T(page, () => window.__scTest.stoFree())).exact).toBe(false);
  });
  test("Windows: the app-data drive's real free space (async preload) is exact", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(() => { window.SCNative.platform = "windows"; window.SCNative.storageInfo = () => Promise.resolve({ free: 98_000_000_000, total: 256_000_000_000, exact: true }); });
    await boot(page);
    await openStorage(page);
    await expect(page.locator(".stofree")).toHaveClass(/exact/);
    await expect(page.locator(".stofree b")).toHaveText(await T(page, () => window.__scTest.fmtMB(98_000_000_000)));
  });
});

// ═════════════ 1 + 2. widget / Android Auto data ═════════════
test.describe("widget + Android Auto", () => {
  test("media state carries lang + queue; Auto library = favorites / playlists / offline / recent, without any token", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await boot(page);
    await page.waitForSelector("#trend .tr");
    await page.click("#trend .tr >> nth=0");
    await playing(page);
    const st = (await nCalls(page, "mediaState")).map((c) => JSON.parse(c[1]));
    const withQ = st.filter((s) => s.queue);
    expect(withQ.length).toBeGreaterThan(0);
    expect(withQ[0].queue.map((x) => x.id)).toEqual(TRENDING.map((t) => t.id));
    expect(st.pop()).toEqual(expect.objectContaining({ lang: "fa", qi: 0, id: TRENDING[0].id, playing: true }));
    // queue is only re-sent when it changes
    expect(withQ.length).toBe(1);
    await offPut(page, [{ id: 801, title: "آفلاین یک" }]);
    await T(page, () => window.__scTest.autoLibPush(true));
    await expect.poll(async () => (await nCalls(page, "autoLib")).length).toBeGreaterThan(0);
    const raw = (await nCalls(page, "autoLib")).pop()[1];
    expect(raw).not.toContain(TOKEN);
    expect(raw).not.toMatch(/sc_token|x-app-token|initData/);
    const lib = JSON.parse(raw);
    expect(lib.lang).toBe("fa");
    expect(Object.keys(lib).sort()).toEqual(["fav", "lang", "off", "pls", "rec"]);
    expect(lib.off.map((t) => t.id)).toEqual([801]);
    expect(lib.rec[0].id).toBe(TRENDING[0].id);
    // Auto picks a song from "recent" and then a queue item: real playback through the same player
    await T(page, () => window.__scMedia("playid", JSON.stringify({ list: "off", id: 801 })));
    await expect.poll(() => nowId(page), { timeout: 10000 }).toBe(801);
    await page.click(".nav button[data-tab=home]");
    await page.click("#trend .tr >> nth=0");
    await playing(page);
    await T(page, () => window.__scMedia("qi", 3));
    await expect.poll(() => nowId(page), { timeout: 10000 }).toBe(TRENDING[3].id);
    await T(page, () => window.__scMedia("pause"));
    await expect.poll(async () => JSON.parse((await nCalls(page, "mediaState")).pop()[1]).playing).toBe(false);
  });
  test("widget item + battery card in settings, schedule and follows (Android, honest texts)", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await page.addInitScript(() => {
      window.__ret = { widgetInfo: { pin: true, placed: false }, batteryInfo: { ignoring: false, maker: "xiaomi" } };
      const rec = (n) => (...a) => { window.__nativeCalls.push([n, ...a]); return JSON.stringify(window.__ret[n]); };
      window.SCNative.widgetInfo = rec("widgetInfo"); window.SCNative.batteryInfo = rec("batteryInfo");
      window.SCNative.schedTake = () => "{}";
    });
    await boot(page);
    await page.click(".nav button[data-tab=settings]");
    const wg = page.locator(".it[data-act=wgadd]");
    await expect(wg).toContainText(await L(page, "wgTitle"));
    await expect(wg.locator("small")).toHaveText(await L(page, "wgAdd"));
    await wg.click();
    expect((await nCalls(page, "widgetPin")).length).toBe(1);
    await page.click(".it[data-act=batsheet]");
    const card = page.locator(".sheet.show .batc");
    await expect(card).toContainText(await L(page, "batOn"));
    await expect(card).toContainText(await L(page, "batXiaomi"));
    await expect(card).toContainText(await L(page, "batHint"));
    expect(await L(page, "batHint")).toMatch(FA);
    await shot(page, "battery");
    await card.locator("[data-act=batopen]").click();
    expect((await nCalls(page, "openBatterySettings")).length).toBe(1);
    // exempted → says so
    await T(page, () => { window.__ret.batteryInfo = { ignoring: true, maker: "google" }; });
    await page.click(".ov.show", { position: { x: 200, y: 20 } }); await page.waitForTimeout(450);
    await page.click(".it[data-act=schopen]");
    await expect(page.locator("#schbat .batc")).toContainText(await L(page, "batOff"));
    await expect(page.locator(".sheet.show")).toContainText(await L(page, "schNoteBgA"));
    await shot(page, "schedule-background");
    await page.click(".ov.show", { position: { x: 200, y: 20 } }); await page.waitForTimeout(450);
    await page.click(".it[data-act=folopen]");
    await expect(page.locator("#folbat .batc")).toBeVisible();
    // widget already on the home screen
    await T(page, () => { window.__ret.widgetInfo = { pin: true, placed: true }; });
    await page.click(".nav button[data-tab=settings]");
    await expect(page.locator(".it[data-act=wgadd] small")).toHaveText(await L(page, "wgPlaced"));
    await page.locator(".it[data-act=wgadd]").scrollIntoViewIfNeeded();
    await shot(page, "settings-widget");
  });
  test("no battery / widget UI where they don't exist (Windows, Mini App)", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(() => { window.SCNative.platform = "windows"; });
    await boot(page);
    await page.click(".nav button[data-tab=settings]");
    await expect(page.locator(".it[data-act=wgadd]")).toHaveCount(0);
    await expect(page.locator(".it[data-act=batsheet]")).toHaveCount(0);
  });
});

// ═════════════ 4. background release check (Android) ═════════════
test.describe("background release alerts", () => {
  const FOLS = (now) => JSON.stringify([{ id: 77, username: "خواننده تست", followed_at: now - 864e5, seen: [], muted: false }]);
  test("bgSync gets the exact contract; alerts the background job showed are merged once and never repeated; a_<id> opens the artist", async ({ page }) => {
    const now = Date.now();
    await setup(page, { seed: { sc_follows: FOLS(now), sc_fol_on: "true" }, api: (p, req, json) => {
      if (p.startsWith("/releases")) return json({ releases: { 77: [{ id: 9100, title: "تازه پس‌زمینه", artist: "خواننده تست", username: "خواننده تست", user_id: 77, duration_ms: 30000, created_at: new Date(now).toISOString() }] }, failed: [] });
      if (p.startsWith("/user/77")) return json({ user: { id: 77, username: "خواننده تست", avatar_url: null, followers: 1, tracks: 1 }, top: [], latest: [] });
    } });
    await page.addInitScript(NATIVE_V151);
    await page.addInitScript((now) => {
      window.__bg = "";
      window.SCNative.bgSeen = () => { window.__nativeCalls.push(["bgSeen"]); const x = window.__bg; window.__bg = ""; return x; };
    }, now);
    await boot(page);
    await expect.poll(async () => (await nCalls(page, "bgSync")).length).toBeGreaterThan(0);
    const cfg = JSON.parse((await nCalls(page, "bgSync")).pop()[1]);
    expect(cfg).toEqual(expect.objectContaining({ enabled: true, token: TOKEN, lang: "fa" }));
    expect(cfg.api).toMatch(/^https:\/\/.+\/scbot\/api$/);
    expect(cfg.list).toEqual([{ id: 77, username: "خواننده تست", followed_at: now - 864e5, seen: [], muted: false, alert_day: "" }]);
    // the background job (app closed) found 9100 and notified → the app learns it on the next event
    const today = await T(page, () => window.__scTest.dayKey());
    await T(page, ([today, now]) => { window.__bg = JSON.stringify({ 77: { news: [{ id: 9100, title: "تازه پس‌زمینه", artist: "خواننده تست", created_at: now }], seen: [9100], alert_day: today } }); }, [today, now]);
    await native(page, { __sc: "bgnews" });
    await expect.poll(() => T(page, () => window.__scTest.FOL.news.map((n) => n.t.id))).toEqual([9100]);
    const f = await T(page, () => window.__scTest.FOL.list[0]);
    expect(f.seen).toEqual([9100]); expect(f.alert_day).toBe(today);
    // the in-app check sees the same song → no second notification, no duplicate entry
    expect(await T(page, () => window.__scTest.folCheck())).toBe(0);
    expect(await nCalls(page, "notify")).toEqual([]);
    expect(await T(page, () => window.__scTest.FOL.news.length)).toBe(1);
    // native got the merged state back (so it won't alert again either)
    expect(JSON.parse((await nCalls(page, "bgSync")).pop()[1]).list[0]).toEqual(expect.objectContaining({ seen: [9100], alert_day: today }));
    // tapping a summary notification ("a_<artist>")
    await T(page, () => { window.__link = "a_77"; window.postMessage({ __sc: "link" }, location.origin); });
    await expect.poll(() => T(page, () => { const v = window.__scTest.S.stack.at(-1); return v.type + ":" + v.id; })).toBe("artist:77");
    // global switch off / unfollow → native disabled
    await T(page, () => window.__scTest.folToggle && window.__scTest.folToggle(false));
    await T(page, () => { window.__scTest.FOL.list.length = 0; window.__scTest.folSyncNative(); });
    expect(JSON.parse((await nCalls(page, "bgSync")).pop()[1]).enabled).toBe(false);
  });
});

// ═════════════ 5. background scheduled downloads (Android) ═════════════
test.describe("background scheduled downloads", () => {
  test("songs the native worker finished are imported into Offline from /bgdl/ (no internet), acknowledged only after saving, never twice", async ({ page }) => {
    const WAV = silentWav(2);
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await page.addInitScript(() => {
      window.__take = [];
      window.SCNative.schedTake = () => { window.__nativeCalls.push(["schedTake"]); return JSON.stringify(window.__take.shift() || {}); };
    });
    const bg = [];
    await page.route("**/bgdl/**", (route) => { bg.push(new URL(route.request().url()).pathname); return route.fulfill({ status: 200, contentType: "application/octet-stream", body: WAV }); });
    await boot(page);
    const done = { id: 100, kind: "progressive", preset: "aac_160k", track: { id: 100, title: "آهنگ پس‌زمینه", artist: "هنرمند", duration_ms: 2000 }, files: ["audio"], bytes: WAV.length };
    await T(page, (d) => { window.__take.push({ done: [d], failed: {} }, { done: [d], failed: {} }); }, done);
    await native(page, { __sc: "sched" });
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(100)), { timeout: 10000 }).toBe(true);
    expect((await idbSizes(page))[100]).toBe(WAV.length);
    expect(bg).toEqual(["/bgdl/100/audio"]);
    expect((await nCalls(page, "schedAck")).map((c) => c[1])).toEqual(["100"]);
    await expect(toastText(page)).toHaveText(await L(page, "bgImported", 1));
    // the same id again (e.g. ack lost) → acknowledged without downloading/storing a second copy
    await native(page, { __sc: "sched" });
    await expect.poll(async () => (await nCalls(page, "schedAck")).length).toBe(2);
    expect(bg.length).toBe(1);
    // the schedule the worker receives: the real queue + limits, and the session token only
    const cfg = JSON.parse((await nCalls(page, "schedSet")).pop()[1]);
    expect(Object.keys(cfg)).toEqual(expect.arrayContaining(["on", "from", "to", "days", "wifi", "charge", "api", "token", "lang", "limitMB", "usedBytes", "items"]));
    expect(cfg.token).toBe(TOKEN);
    expect(cfg.usedBytes).toBe(WAV.length);
  });
  test("a broken native file is not stored and not acknowledged (stays for the next try)", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await page.addInitScript(() => { window.SCNative.schedTake = () => JSON.stringify({ done: [{ id: 101, kind: "progressive", track: { id: 101, title: "خراب" }, files: ["audio"] }] }); });
    await page.route("**/bgdl/**", (route) => route.fulfill({ status: 404, body: "" }));
    await boot(page);
    await T(page, () => window.__scTest.schImport());
    expect(await T(page, () => window.__scTest.OFF.ids.has(101))).toBe(false);
    expect(await nCalls(page, "schedAck")).toEqual([]);
  });
});

// ═════════════ 6. backup share ═════════════
test.describe("backup share", () => {
  const openBk = async (page) => { await page.click(".nav button[data-tab=settings]"); await page.click(".it[data-act=bkopen]"); await page.waitForSelector(".sheet.show .bks"); };
  test("Android share sheet gets a JSON file without any token / secret; native refusal is explained in Persian", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await boot(page);
    await openBk(page);
    await page.click("[data-act=bkexp][data-m=share]");
    await expect.poll(async () => (await nCalls(page, "shareFile")).length).toBe(1);
    const [, name, mime, text] = (await nCalls(page, "shareFile"))[0];
    expect(name).toMatch(/^[\w.-]{1,80}\.json$/);
    expect(mime).toBe("application/json");
    expect(text).not.toContain(TOKEN);
    expect(text).not.toMatch(/sc_token|x-app-token|x-init-data|"hash"\s*:|auth_date=|appToken|initData/i);
    expect(JSON.parse(text).format).toBe("soundcloud-player-backup");
    // the bridge refuses (its own secret scan) → message, no fake success
    await T(page, () => { window.SCNative.shareFile = () => "secret"; });
    await openBk(page);
    await page.click("[data-act=bkexp][data-m=share]");
    await expect(toastText(page)).toHaveText(await L(page, "bkSecret"));
    expect(await L(page, "bkSecret")).toMatch(FA);
  });
  test("Windows save dialog keeps working (ok / canceled / secret)", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(() => { window.SCNative.platform = "windows"; window.__save = "ok"; window.__saved = []; window.SCNative.saveFile = (n, t) => { window.__saved.push([n, t]); return Promise.resolve(window.__save); }; });
    await boot(page);
    await openBk(page);
    await page.click("[data-act=bkexp][data-m=save]");
    await expect(toastText(page)).toHaveText(await L(page, "bkSaved"));
    const [[n, t]] = await T(page, () => window.__saved);
    expect(n).toMatch(/\.json$/); expect(t).not.toContain(TOKEN);
    await page.waitForTimeout(2500);
    await T(page, () => { window.__save = "secret"; });
    await openBk(page);
    await page.click("[data-act=bkexp][data-m=save]");
    await expect(toastText(page)).toHaveText(await L(page, "bkSecret"));
  });
});

// ═════════════ 3. native speech bridge (the event contract of the Android SpeechRecognizer bridge) ═════════════
test.describe("native voice search contract", () => {
  test("ready → partial → final is editable; stop on close; late results ignored; every error code has a Persian message", async ({ page }) => {
    await setup(page, {});
    await page.addInitScript(NATIVE_V151);
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click("[data-act=vs]");
    expect((await nCalls(page, "speechStart"))[0]).toEqual(["speechStart", "fa-IR"]);
    await native(page, { __sc: "speech", type: "ready" });
    await native(page, { __sc: "speech", type: "partial", text: "محسن" });
    await expect(page.locator("#vstext")).toHaveValue("محسن");
    await native(page, { __sc: "speech", type: "final", text: "محسن یگانه" });
    await expect(page.locator("#vstext")).toHaveValue("محسن یگانه");
    await page.fill("#vstext", "محسن چاوشی");
    await native(page, { __sc: "speech", type: "final", text: "دیر رسید" }); // late
    await expect(page.locator("#vstext")).toHaveValue("محسن چاوشی");
    await shot(page, "voice-native");
    for (const code of ["na", "perm", "nomatch", "net", "nalang", "err"]) {
      await page.click("[data-act=vsagain]");
      await native(page, { __sc: "speech", type: "error", code });
      const msg = await page.locator("#vsmsg").textContent();
      expect(msg, code).toMatch(FA);
      await expect(page.locator("#vstext")).toHaveValue("محسن چاوشی"); // never replaced by fake text
    }
    const before = (await nCalls(page, "speechStop")).length;
    await page.click("[data-act=vsagain]");
    await page.click(".ov.show", { position: { x: 200, y: 20 } }); await page.waitForTimeout(450);
    expect((await nCalls(page, "speechStop")).length).toBeGreaterThan(before);
    await native(page, { __sc: "speech", type: "final", text: "بعد از بستن" });
    expect(await T(page, () => window.__scTest.VS.text)).not.toBe("بعد از بستن");
  });
});
