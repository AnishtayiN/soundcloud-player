// v1.4 feature tests for the shared web UI (runs on the Android WebView origin with a fake native bridge).
// Queue · cross-device resume · smart offline · lyrics · my stats · recognition · sleep timer / speed / EQ
import { test, expect } from "@playwright/test";
import { setup, boot, track, TRENDING, START_URL, API } from "./harness.mjs";

test.use({ viewport: { width: 412, height: 860 } });

const T = (page, fn, arg) => page.evaluate(fn, arg);
const playing = (page) => page.waitForFunction(() => { const a = window.__scTest; return a && !a.S.loadingTrack && window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing); });
const cur = (page) => T(page, () => { const s = window.__scTest.S; return { qi: s.qi, id: s.queue[s.qi]?.id, ids: s.queue.map((t) => t.id), shuffle: s.shuffle, repeat: s.repeat }; });
async function playTrend(page, n) {
  await page.waitForSelector("#trend .tr");
  await page.click(`#trend .tr >> nth=${n}`);
  await playing(page);
}
// the player element lives outside the DOM → reach it through the media session state the app reports
const media = (page) => T(page, () => { const m = window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])); return m[m.length - 1] || {}; });

// ═════════════════════ 1. queue ═════════════════════
test.describe("queue", () => {
  test("play from the middle → queue sheet marks the current song; per-item actions; clear", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await boot(page);
    await playTrend(page, 5);
    expect(await cur(page)).toMatchObject({ qi: 5, id: 105 });
    await page.click(".mini .meta"); // open player
    await page.click(".fp [data-act=showqueue]");
    await expect(page.locator(".sheet.show .qrow")).toHaveCount(12);
    await expect(page.locator(".sheet.show .qrow.cur")).toHaveAttribute("data-qi", "5");
    await expect(page.locator(".sheet.show .qrow.cur .qnow")).toHaveText("در حال پخش");
    // "play next" on item 9 → it becomes 6
    await page.click(".sheet.show .qrow[data-qi='9'] .more");
    await page.click(".sheet.show [data-act=qnext]");
    expect((await cur(page)).ids.slice(5, 8)).toEqual([105, 109, 106]);
    // "add to end" (move to end) on item 6
    await page.click(".sheet.show .qrow[data-qi='6'] .more");
    await page.click(".sheet.show [data-act=qend]");
    expect((await cur(page)).ids.at(-1)).toBe(109);
    // remove item 0
    await page.click(".sheet.show .qrow[data-qi='0'] .more");
    await page.click(".sheet.show [data-act=qrm]");
    let q = await cur(page);
    expect(q.ids.length).toBe(11); expect(q.ids[0]).toBe(101); expect(q.id).toBe(105); expect(q.qi).toBe(4);
    // drag item 8 two rows up
    const h = page.locator(".sheet.show .qrow[data-qi='8'] .qdrag");
    const before = (await cur(page)).ids;
    const box = await h.boundingBox(), rowH = (await page.locator(".sheet.show .qrow[data-qi='8']").boundingBox()).height;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let k = 1; k <= 9; k++) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - (rowH * 2 * k) / 10); await page.waitForTimeout(16); }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - rowH * 2);
    await page.mouse.up(); // released right after the last move, before another animation frame
    q = await cur(page);
    const exp = before.slice(); const [mv] = exp.splice(8, 1); exp.splice(6, 0, mv);
    expect(q.ids).toEqual(exp);
    expect(q.id).toBe(105); // current song untouched
    // play an item directly
    await page.click(".sheet.show .qrow[data-qi='7'] .meta");
    await playing(page);
    expect((await cur(page)).qi).toBe(7);
    // track menu: "add to queue" appends a copy, "play next" inserts after the current
    await page.click(".fp [data-act=closefp]");
    await page.click(".nav button[data-tab=home]");
    await page.click("#trend .tr >> nth=0 >> .more");
    await page.click(".sheet.show [data-act=m_queue]");
    expect((await cur(page)).ids.at(-1)).toBe(100);
    await page.click("#trend .tr >> nth=11 >> .more");
    await page.click(".sheet.show [data-act=m_next]");
    q = await cur(page); expect(q.ids[q.qi + 1]).toBe(111);
    // clear keeps only the current song
    await page.click(".mini .meta"); await page.click(".fp [data-act=showqueue]");
    await page.click(".sheet.show [data-act=qclear]");
    await page.click(".sheet.show [data-act=cfyes]");
    q = await cur(page); expect(q.ids).toEqual([q.id]); expect(q.qi).toBe(0);
  });

  test("shuffle keeps the original order; turning it off restores it without interrupting the song", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await boot(page);
    await playTrend(page, 3);
    const orig = (await cur(page)).ids;
    const streams = calls.filter((c) => c.startsWith("/stream")).length;
    await page.click(".mini .meta");
    await page.click("#bsh");
    let q = await cur(page);
    expect(q.shuffle).toBe(true); expect(q.id).toBe(103); expect(q.qi).toBe(0);
    expect(q.ids).not.toEqual(orig); expect([...q.ids].sort()).toEqual([...orig].sort());
    await page.waitForTimeout(1200);
    const heard = await T(page, () => window.__scTest.PL.cur.ms);
    await page.click("#bsh");
    q = await cur(page);
    expect(q.shuffle).toBe(false); expect(q.ids).toEqual(orig); expect(q.qi).toBe(3); expect(q.id).toBe(103);
    await page.waitForTimeout(700);
    expect(calls.filter((c) => c.startsWith("/stream")).length).toBe(streams); // same song kept playing — no reload
    expect((await T(page, () => window.__scTest.S.loadingTrack))).toBe(false);
    expect(await T(page, () => window.__scTest.PL.cur.ms)).toBeGreaterThan(heard); // the same listening session went on
    // songs added while shuffled stay in the restored order
    await page.click("#bsh");
    await T(page, () => { const t = window.__scTest; t.qAppend(t.S.tracks.get(100)); });
    await page.click("#bsh");
    q = await cur(page); expect(q.ids).toEqual([...orig, 100]); expect(q.qi).toBe(3);
  });

  test("repeat: one replays the song, all wraps to the first song", async ({ page }) => {
    await setup(page);
    await boot(page);
    await playTrend(page, 11);
    await page.click(".mini .meta");
    await page.click("#brp"); // all
    await page.click("#brp"); // one
    expect((await cur(page)).repeat).toBe("one");
    await page.evaluate(() => window.__scMedia("seek", 28500));
    await page.waitForFunction(() => { const m = window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])); return m.length && m.at(-1).position < 3000 && m.at(-1).playing; }, null, { timeout: 10000 });
    expect(await cur(page)).toMatchObject({ qi: 11, id: 111 });
    await page.click("#brp"); // off
    await page.click("#brp"); // all
    expect((await cur(page)).repeat).toBe("all");
    await page.evaluate(() => window.__scMedia("seek", 28500));
    await page.waitForFunction(() => window.__scTest.S.qi === 0, null, { timeout: 10000 });
    await playing(page);
    expect((await cur(page)).id).toBe(100);
  });

  test("queue, order, shuffle state and position are restored after a restart", async ({ page, context }) => {
    await setup(page);
    await boot(page);
    await playTrend(page, 4);
    const orig = (await cur(page)).ids;
    await T(page, () => window.__scTest.setShuffle(true));
    const removed = await T(page, () => { const t = window.__scTest, id = t.S.queue[5].id; t.qRemove(5); t.qInsertNext(t.S.tracks.get(100)); return id; });
    await page.evaluate(() => window.__scMedia("seek", 9000));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__scMedia("pause"));
    await page.waitForTimeout(400);
    const before = await cur(page);
    await page.close();
    const p2 = await context.newPage();
    const calls2 = [];
    await setup(p2, { calls: calls2 });
    await p2.goto(START_URL);
    await p2.waitForSelector(".mini.show");
    expect(await cur(p2)).toEqual(before); // same shuffled queue, index, shuffle + repeat state
    expect(calls2.filter((c) => c.startsWith("/stream")).length).toBe(0);
    // the original (pre-shuffle) order survived the restart too
    await T(p2, () => window.__scTest.setShuffle(false));
    const exp = orig.filter((id) => id !== removed); exp.splice(exp.indexOf(104) + 1, 0, 100);
    const un = await cur(p2);
    expect(un.ids).toEqual(exp); expect(un.id).toBe(104); expect(un.qi).toBe(exp.indexOf(104));
    await p2.click("#mpp");
    await p2.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing && JSON.parse(c[1]).position >= 8000), null, { timeout: 15000 });
  });

  test("an unavailable song is skipped (no crash, no endless retry — even with repeat one)", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, api: (p, req, json) => { if (/^\/stream\/10[45]/.test(p)) return json({ error: "NO_STREAM" }, 404); } });
    await boot(page);
    await playTrend(page, 3);
    await page.evaluate(() => window.__scMedia("next"));
    await page.waitForFunction(() => window.__scTest.S.qi === 6, null, { timeout: 10000 }); // 104 and 105 fail → 106
    await playing(page);
    expect((await cur(page)).id).toBe(106);
    await expect(page.locator(".toast")).toHaveText("این آهنگ در دسترس نبود؛ رفتیم سراغ بعدی");
    // repeat one on a failing song: moves on instead of looping
    await T(page, () => { window.__scTest.S.repeat = "one"; });
    const n0 = calls.filter((c) => c.startsWith("/stream/104")).length;
    await page.click(".mini .meta"); await page.click(".fp [data-act=showqueue]");
    await page.click(".sheet.show .qrow[data-qi='4'] .meta");
    await page.waitForFunction(() => window.__scTest.S.qi === 6, null, { timeout: 10000 });
    await page.waitForTimeout(1500);
    expect(calls.filter((c) => c.startsWith("/stream/104")).length - n0).toBe(1);
    expect((await cur(page)).qi).toBe(6);
  });
  test("a direct link that fails (e.g. expired) is refreshed once and continues; a broken one is skipped", async ({ page }) => {
    const calls = [], hits = {};
    await setup(page, { calls, media: (url, route) => {
      const id = url.pathname.match(/(\d+)\.wav/)?.[1]; hits[id] = (hits[id] || 0) + 1;
      if (id === "102" || (id === "101" && hits[id] === 1)) return route.fulfill({ status: 403, body: "expired" });
    } });
    await boot(page);
    await playTrend(page, 1); // 101: first link "expired" → one fresh /stream → plays
    expect((await cur(page)).id).toBe(101);
    expect(calls.filter((c) => c.startsWith("/stream/101")).length).toBe(2);
    await page.evaluate(() => window.__scMedia("next")); // 102 always broken → refreshed once, then skipped to 103
    await page.waitForFunction(() => window.__scTest.S.qi === 3, null, { timeout: 10000 });
    await playing(page);
    expect(calls.filter((c) => c.startsWith("/stream/102")).length).toBe(2);
    await page.waitForTimeout(1500);
    expect(calls.filter((c) => c.startsWith("/stream/102")).length).toBe(2); // no retry loop
  });
});

// ═════════════════════ 2. cross-device resume ═════════════════════
function resumeServer() {
  const srv = { state: null, posts: [] };
  srv.api = (p, req, json) => {
    if (!p.startsWith("/resume")) return;
    if (req.method() === "POST") {
      const b = JSON.parse(req.postData() || "{}"); srv.posts.push(b);
      const applied = !srv.state || b.updated_at > srv.state.updated_at; // newest wins (the real rule lives in SQL)
      if (applied) srv.state = b;
      return json({ applied, state: srv.state, server_time: Date.now() });
    }
    return json({ state: srv.state, server_time: Date.now() });
  };
  return srv;
}
test.describe("cross-device resume", () => {
  test("continue on another device from the same position", async ({ browser }) => {
    const srv = resumeServer();
    const A = await browser.newContext(), pa = await A.newPage();
    await setup(pa, { api: srv.api });
    await boot(pa);
    await playTrend(pa, 2);
    await pa.evaluate(() => window.__scMedia("seek", 12000));
    await pa.waitForTimeout(400);
    await pa.evaluate(() => window.__scMedia("pause"));
    await expect.poll(() => srv.state && srv.state.position_ms).toBeGreaterThanOrEqual(11500);
    expect(srv.state).toMatchObject({ track_id: 102, ended: false, device: "Android" });
    const devA = srv.state.device_id;

    const B = await browser.newContext(), pb = await B.newPage();
    await setup(pb, { api: srv.api });
    await boot(pb);
    await expect(pb.locator(".rsm.show")).toBeVisible({ timeout: 8000 });
    await expect(pb.locator(".rsm.show b")).toHaveText(/ادامه از دقیقه‌ی 0:1[12]/);
    expect(await pb.evaluate(() => window.__scTest.DEVICE_ID)).not.toBe(devA);
    // A never sees its own state as a banner
    await pa.evaluate(() => window.__scTest.rsCheck(true));
    await expect(pa.locator(".rsm.show")).toHaveCount(0);
    await pb.click(".rsm.show .btn");
    await pb.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing && JSON.parse(c[1]).position >= 11000), null, { timeout: 15000 });
    expect((await cur(pb)).id).toBe(102);
    await expect(pb.locator(".rsm.show")).toHaveCount(0);
    await A.close(); await B.close();
  });

  test("conflict + offline: an older offline change never overwrites a newer state; a newer offline change syncs when back online", async ({ browser }) => {
    const srv = resumeServer();
    const B = await browser.newContext(), pb = await B.newPage();
    await setup(pb, { api: srv.api });
    await boot(pb);
    await playTrend(pb, 1);
    // B goes offline and pauses → kept locally (pending)
    await pb.evaluate(() => { Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }); });
    await pb.evaluate(() => window.__scMedia("seek", 8000));
    await pb.waitForTimeout(300);
    await pb.evaluate(() => window.__scMedia("pause"));
    await pb.waitForTimeout(400);
    const localB = await pb.evaluate(() => JSON.parse(localStorage.getItem("sc_resume")));
    expect(localB.pending).toBe(true); expect(localB.track_id).toBe(101);
    expect(srv.state === null || srv.state.track_id !== 101 || srv.state.position_ms < 7000).toBe(true);
    // meanwhile A (online) plays something else → newer state on the server
    const A = await browser.newContext(), pa = await A.newPage();
    await setup(pa, { api: srv.api });
    await boot(pa);
    await playTrend(pa, 7);
    await pa.evaluate(() => window.__scMedia("seek", 15000));
    await pa.waitForTimeout(300);
    await pa.evaluate(() => window.__scMedia("pause"));
    await expect.poll(() => srv.state && srv.state.track_id).toBe(107);
    const newer = srv.state.updated_at;
    // B back online → flushes its older change → rejected; B now offers A's newer state
    await pb.evaluate(() => { delete navigator.onLine; Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }); window.dispatchEvent(new Event("online")); });
    await expect.poll(() => srv.posts.filter((x) => x.track_id === 101 && x.position_ms >= 7500).length, { timeout: 8000 }).toBeGreaterThan(0);
    const devA = await pa.evaluate(() => window.__scTest.DEVICE_ID);
    expect(srv.state.track_id).toBe(107); expect(srv.state.device_id).toBe(devA); expect(srv.state.updated_at).toBeGreaterThanOrEqual(newer); // B's older change was rejected
    await expect(pb.locator(".rsm.show")).toBeVisible({ timeout: 8000 });
    await expect(pb.locator(".rsm.show .meta span")).toContainText("آهنگ 107");
    expect((await pb.evaluate(() => JSON.parse(localStorage.getItem("sc_resume")))).pending).toBe(false);

    // newer offline change on A: A offline → plays/pauses → back online → server takes it, B is offered it
    await pa.evaluate(() => { Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }); });
    await pa.evaluate(() => window.__scMedia("play"));
    await pa.waitForTimeout(600);
    await pa.evaluate(() => window.__scMedia("seek", 21000));
    await pa.waitForTimeout(300);
    await pa.evaluate(() => window.__scMedia("pause"));
    await pa.waitForTimeout(300);
    expect(srv.state.position_ms).toBeLessThan(20000); // nothing sent while offline
    await pa.evaluate(() => { delete navigator.onLine; Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }); window.dispatchEvent(new Event("online")); });
    await expect.poll(() => srv.state.position_ms, { timeout: 8000 }).toBeGreaterThanOrEqual(20500);
    await pb.evaluate(() => window.__scTest.rsCheck(true));
    await expect(pb.locator(".rsm.show b")).toHaveText(/0:2[01]/);
    await A.close(); await B.close();
  });

  test("near the end (>95%) or ended → offers to start from the beginning", async ({ browser }) => {
    const srv = resumeServer();
    srv.state = { track_id: 105, track: track(105, "آهنگ ۱۰۵"), position_ms: 29500, duration_ms: 30000, ended: false, device_id: "d-other-device-0001", device: "Windows", updated_at: Date.now() - 1000 };
    const B = await browser.newContext(), pb = await B.newPage();
    await setup(pb, { api: srv.api });
    await boot(pb);
    await expect(pb.locator(".rsm.show b")).toHaveText("پخش دوباره از اول", { timeout: 8000 });
    await expect(pb.locator(".rsm.show small")).toHaveText("از دستگاه دیگه (Windows)");
    await pb.click(".rsm.show .btn");
    await playing(pb);
    expect((await media(pb)).position).toBeLessThan(3000);
    await B.close();
  });

  test("no banner for: own device, an older state than local, an invalid position, or one already dismissed", async ({ browser }) => {
    const srv = resumeServer();
    const B = await browser.newContext(), pb = await B.newPage();
    await setup(pb, { api: srv.api, seed: { sc_device_id: "d-this-device-00001" } });
    await boot(pb);
    const check = async (st) => { srv.state = st; await pb.evaluate(() => window.__scTest.rsCheck(true)); await pb.waitForTimeout(300); return pb.locator(".rsm.show").count(); };
    const base = { track_id: 104, track: track(104, "x"), position_ms: 60000, duration_ms: 200000, ended: false, device: "Windows" };
    expect(await check({ ...base, device_id: "d-this-device-00001", updated_at: Date.now() })).toBe(0);
    expect(await check({ ...base, device_id: "d-other-000000001", position_ms: 0, updated_at: Date.now() })).toBe(0);
    await pb.evaluate(() => localStorage.setItem("sc_resume", JSON.stringify({ track_id: 1, updated_at: Date.now() + 60000, pending: false })));
    expect(await check({ ...base, device_id: "d-other-000000001", updated_at: Date.now() })).toBe(0);
    await pb.evaluate(() => localStorage.removeItem("sc_resume"));
    const st = { ...base, device_id: "d-other-000000001", updated_at: Date.now() };
    expect(await check(st)).toBe(1);
    await pb.click(".rsm.show [data-act=rsx]");
    expect(await check(st)).toBe(0); // dismissed
    await B.close();
  });
});

// ═════════════════════ 3. smart offline ═════════════════════
const idbCounts = (page) => page.evaluate(() => new Promise((res) => {
  const r = indexedDB.open("sc_offline"); r.onsuccess = () => { const d = r.result, tx = d.transaction(["audio", "meta", "lyrics"]); const out = {};
    let n = 0; for (const s of ["audio", "meta", "lyrics"]) { const q = tx.objectStore(s).getAllKeys(); q.onsuccess = () => { out[s] = q.result.sort(); if (++n === 3) res(out); }; } };
}));
test.describe("smart offline", () => {
  test("batch playlist download: skips songs already offline, real options, overall + per-song status", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await boot(page);
    await T(page, async () => { const t = window.__scTest; await t.offPut(t.S.tracks.get(100), new Blob([new Uint8Array(2000)], { type: "audio/wav" }), true); });
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=pl][data-id='2']");
    await page.waitForSelector(".acts [data-act=pldl]");
    await page.click(".acts [data-act=pldl]");
    await expect(page.locator(".sheet.show h3")).toHaveText("دانلود 2 آهنگ برای آفلاین");
    await expect(page.locator(".sheet.show .lyo")).toContainText("از قبل آفلاین بود: 1");
    await expect(page.locator(".sheet.show .dlopt")).toHaveCount(2);
    await expect(page.locator(".sheet.show .dlopt.on")).toContainText("کیفیت بالا");
    await page.click(".sheet.show .dlopt[data-q=high]");
    await expect.poll(() => T(page, () => [101, 102].every((id) => window.__scTest.OFF.ids.has(id))), { timeout: 15000 }).toBe(true);
    expect(calls).toContain("/stream/101/options");
    expect(calls).toContain("/stream/101?preset=aac_160k");
    expect(calls.filter((c) => c.startsWith("/stream/100")).length).toBe(0); // already offline → skipped
    await expect(page.locator("#view .tr .offi")).toHaveCount(3);
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=dlopen]");
    await expect(page.locator(".dlsum .dlrow b")).toHaveText("3 از 3 آهنگ");
    await expect(page.locator(".tr.dlj.skip .dlst")).toHaveText("از قبل آفلاین بود");
    await expect(page.locator(".tr.dlj.done")).toHaveCount(2);
    const c = await idbCounts(page);
    expect(c.audio).toEqual(c.meta); expect(c.audio).toEqual([100, 101, 102]);
  });

  test("cancel one, cancel all, retry failed — never a partial file", async ({ page }) => {
    let fail101 = true;
    await setup(page, {
      media: async (url, route) => {
        if (url.pathname.includes("/100.wav")) { await new Promise((r) => setTimeout(r, 4000)); return; }
        if (url.pathname.includes("/101.wav") && fail101) { fail101 = false; return route.fulfill({ status: 500, body: "x", headers: { "access-control-allow-origin": "*" } }); }
      },
    });
    await boot(page);
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=pl][data-id='2']");
    await page.click(".acts [data-act=pldl]");
    await page.click(".sheet.show .dlopt[data-q=low]");
    await T(page, () => window.__scTest.go({ type: "downloads" }));
    await expect(page.locator(".tr.dlj.run")).toHaveCount(1);
    await expect(page.locator(".tr.dlj.queued")).toHaveCount(2);
    await expect(page.locator(".tr.dlj.queued .dlst").first()).toHaveText("در صف دانلود");
    await page.click(".tr.dlj.run [data-act=dlcancel]"); // cancel the running one (100)
    await expect(page.locator(".tr.dlj.cancel[data-id='100'] .dlst")).toHaveText("لغو شد");
    await expect(page.locator(".tr.dlj.fail[data-id='101'] .dlst")).toContainText("ناموفق", { timeout: 10000 });
    await expect(page.locator(".tr.dlj.done[data-id='102']")).toHaveCount(1, { timeout: 10000 });
    await page.click("[data-act=dlretry]");
    await expect(page.locator(".tr.dlj.done[data-id='101']")).toHaveCount(1, { timeout: 10000 });
    let c = await idbCounts(page);
    expect(c.audio).toEqual([101, 102]); expect(c.meta).toEqual([101, 102]);
    // cancel all: 100 is slow again, the others are queued
    await T(page, () => { const t = window.__scTest; t.dlEnqueue([t.S.tracks.get(100), t.S.tracks.get(103), t.S.tracks.get(104)], { q: "low" }); });
    await expect(page.locator(".tr.dlj.run[data-id='100']")).toHaveCount(1);
    await page.click("[data-act=dlcancelall]");
    await page.click(".sheet.show [data-act=cfyes]");
    await expect(page.locator(".tr.dlj.cancel")).toHaveCount(3);
    await page.waitForTimeout(4500);
    c = await idbCounts(page);
    expect(c.audio).toEqual([101, 102]); expect(c.meta).toEqual([101, 102]); // nothing partial / orphaned
  });

  test("not enough room (storage limit or free disk) → nothing starts, clear Persian message", async ({ page }) => {
    const long = Array.from({ length: 3 }, (_, i) => Object.assign(track(500 + i, "طولانی " + i), { duration_ms: 3 * 3600 * 1000 }));
    await page.addInitScript(() => { window.__est = null; const o = navigator.storage.estimate.bind(navigator.storage); navigator.storage.estimate = () => (window.__est ? Promise.resolve(window.__est) : o()); });
    await setup(page, { seed: { sc_off_limit: "250" }, api: (p, req, json) => { if (p === "/playlists/2") return json({ playlist: { id: 2, name: "طولانی", is_public: true }, tracks: long }); } });
    await boot(page);
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=pl][data-id='2']");
    await page.click(".acts [data-act=pldl]");
    await page.click(".sheet.show .dlopt[data-q=high]");
    await expect(page.locator(".toast.show")).toContainText("جا نیست");
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0);
    // free disk space
    await T(page, () => { window.__est = { quota: 10 * 1048576, usage: 9.9 * 1048576 }; });
    await page.click(".nav button[data-tab=home]");
    await page.click("#trend .tr >> nth=0 >> .more");
    await page.click(".sheet.show [data-act=m_offsave]");
    await page.click(".sheet.show .dlopt >> nth=0");
    await expect(page.locator(".toast.show")).toContainText("فضای خالی دستگاه کافی نیست");
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0);
  });

  test("per-song quality from the backend's real options, approximate size, default quality setting", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await boot(page);
    await page.click("#trend .tr >> nth=0 >> .more");
    await page.click(".sheet.show [data-act=m_offsave]");
    await expect(page.locator(".sheet.show .dlopt")).toHaveCount(2);
    await expect(page.locator(".sheet.show .dlopt >> nth=0")).toContainText("162 kbps");
    await expect(page.locator(".sheet.show .dlopt >> nth=0")).toContainText("حدود 0.5 MB");
    await expect(page.locator(".sheet.show .dlopt.on")).toContainText("کیفیت بالا");
    await page.click(".sheet.show .dlopt >> nth=1");
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(100)), { timeout: 10000 }).toBe(true);
    expect(calls).toContain("/stream/100?preset=aac_96k");
    // default quality → low
    await page.click(".nav button[data-tab=settings]");
    await page.click("[data-act=ofq]");
    await expect(page.locator("[data-act=ofq] .v")).toHaveText("کم‌حجم");
    await page.click(".nav button[data-tab=home]");
    await page.click("#trend .tr >> nth=1 >> .more");
    await page.click(".sheet.show [data-act=m_offsave]");
    await expect(page.locator(".sheet.show .dlopt.on")).toContainText("97 kbps");
  });

  test("auto-download favorites: OFF by default; never on mobile data; only on Wi-Fi", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, net: { known: true, ok: false, type: "cellular" } });
    await boot(page);
    await page.waitForTimeout(1500);
    expect(await T(page, () => localStorage.getItem("sc_off_favauto"))).toBe(null);
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0);
    await page.click(".nav button[data-tab=settings]");
    await expect(page.locator("[data-act=favauto] .sw")).not.toHaveClass(/on/);
    await expect(page.locator("#favnet")).toHaveText("فقط روی Wi-Fi یا اینترنت کابلی؛ هیچ‌وقت روی اینترنت همراه");
    await page.click("[data-act=favauto]");
    await page.waitForTimeout(1500);
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0); // mobile data → nothing
    expect(calls.filter((c) => /\/stream\/\d+\/options/.test(c)).length).toBe(0);
    await T(page, () => { window.__net = { known: true, ok: true, type: "wifi" }; return window.__scTest.favAutoRun("net"); });
    await expect.poll(() => T(page, () => [100, 101, 102].every((id) => window.__scTest.OFF.ids.has(id))), { timeout: 15000 }).toBe(true);
    // switching to mobile data mid-way stops queued auto jobs
    await T(page, () => { window.__net = { known: true, ok: false, type: "cellular" }; const t = window.__scTest; t.dlEnqueue([t.S.tracks.get(105), t.S.tracks.get(106)], { auto: true, q: "low" }); });
    await expect.poll(() => T(page, () => window.__scTest.DLM.jobs.filter((j) => j.auto && j.st === "cancel").length)).toBe(2);
    expect(await T(page, () => window.__scTest.OFF.ids.has(105))).toBe(false);
  });

  test("auto-download favorites when the connection type is unknown → says so and asks first", async ({ page }) => {
    await setup(page);
    await boot(page);
    await page.click(".nav button[data-tab=settings]");
    await expect(page.locator("#favnet")).toHaveText("این دستگاه نوع اتصال رو گزارش نمی‌ده؛ برای همین قبل از هر دانلود خودکار ازت اجازه می‌گیرم");
    await page.click("[data-act=favauto]");
    await expect(page.locator(".sheet.show .cfm h3")).toContainText("نوع اتصال این دستگاه معلوم نیست");
    await page.click(".sheet.show [data-act=cfno]");
    await page.waitForTimeout(800);
    expect(await T(page, () => window.__scTest.DLM.jobs.length)).toBe(0);
  });
});

// ═════════════════════ 4. lyrics ═════════════════════
const LINES = [{ t: 0, text: "خط اول این آهنگ" }, { t: 3000, text: "خط دوم" }, { t: 6000, text: "Third line in English" }, { t: 9000, text: "خط چهارم" }, { t: 12000, text: "خط پنجم" }, { t: 20000, text: "خط ششم" }, ...Array.from({ length: 14 }, (_, i) => ({ t: 21000 + i * 600, text: `ادامه‌ی ترانه ${i + 1}` }))];
const lyricsApi = (calls) => (p, req, json) => {
  if (p === "/lyrics/101") return json({ track_id: 101, status: "synced", lines: LINES, text: LINES.map((l) => l.text).join("\n"), source: "LRCLIB", match: { artist: "هنرمند", title: "آهنگ" } });
  if (p === "/lyrics/103") return json({ track_id: 103, status: "plain", text: "Plain lyric line one\nline two", source: "LRCLIB", match: { artist: "A", title: "B" } });
};
test.describe("lyrics", () => {
  test("synced: current line highlighted, autoscroll, tap to seek; per-line direction; not found; plain", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, api: lyricsApi(calls) });
    await boot(page);
    await playTrend(page, 1);
    await page.click(".mini .meta");
    await page.click("#tly");
    await expect(page.locator("#lyp .ll")).toHaveCount(20);
    await expect(page.locator("#lyp .ll >> nth=0")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("#lyp .ll >> nth=2")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#lyp .ll.on")).toHaveText("خط دوم", { timeout: 6000 });
    await page.click("#lyp .ll >> nth=4"); // seek to 12 s
    await expect(page.locator("#lyp .ll.on")).toHaveText("خط پنجم");
    const pos = await page.evaluate(() => new Promise((r) => setTimeout(() => { const m = window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])); r(m.at(-1).position); }, 300)));
    expect(pos).toBeGreaterThanOrEqual(11800);
    await page.waitForTimeout(400);
    const sc = await page.evaluate(() => { const b = document.querySelector("#lyp"), e = b.querySelector(".ll.on"), rb = b.getBoundingClientRect(), re = e.getBoundingClientRect(); return { st: b.scrollTop, off: Math.abs((re.top + re.height / 2) - (rb.top + rb.height / 2)), max: b.scrollHeight - b.clientHeight }; });
    // the transport controls stay on screen while the lyrics scroll inside their own panel
    expect(await page.evaluate(() => document.querySelector(".fp .bar").getBoundingClientRect().bottom <= innerHeight)).toBe(true);
    expect(sc.st).toBeGreaterThan(0); // auto-scrolled to the current line…
    if (sc.st < sc.max - 2) expect(sc.off).toBeLessThan(30); // …which sits in the middle
    await expect(page.locator("#lyp .lysrc")).toContainText("LRCLIB");
    // a song without lyrics → honest message
    await page.evaluate(() => window.__scMedia("next"));
    await expect(page.locator("#lyp .lyn h3")).toHaveText("متن آهنگ پیدا نشد");
    // plain lyrics
    await page.evaluate(() => window.__scMedia("next"));
    await expect(page.locator("#lyp .lyt")).toContainText("Plain lyric line one");
    await expect(page.locator("#lyp .lyt")).toHaveAttribute("dir", "ltr");
    expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");
  });

  test("lyrics are cached with offline songs and shown without internet", async ({ page }) => {
    const calls = [];
    await setup(page, { calls, api: lyricsApi(calls) });
    await boot(page);
    await T(page, () => { const t = window.__scTest; return t.offDownload(t.S.tracks.get(101), true); });
    const c = await idbCounts(page);
    expect(c.lyrics).toEqual([101]);
    const n = calls.filter((x) => x.startsWith("/lyrics/101")).length;
    await T(page, () => { const t = window.__scTest; t.LY.mem.clear(); t.S.offline = true; });
    await playTrend(page, 1);
    await page.click(".mini .meta");
    await page.click("#tly");
    await expect(page.locator("#lyp .ll")).toHaveCount(20);
    expect(calls.filter((x) => x.startsWith("/lyrics/101")).length).toBe(n); // from the device
    // deleting the offline song deletes its lyrics too
    await T(page, async () => { const t = window.__scTest; t.S.offline = false; });
    await page.click(".fp [data-act=fpmenu]");
    await page.click(".sheet.show [data-act=m_offdel]");
    await page.waitForTimeout(300);
    expect((await idbCounts(page)).lyrics).toEqual([]);
  });
});

// ═════════════════════ 5. my stats ═════════════════════
test.describe("my stats", () => {
  test("counted-play rule (≥30 s or >50%), real listening only, ranges, share by tap", async ({ page }) => {
    const calls = [];
    await setup(page, { calls });
    await boot(page);
    // rule
    expect(await T(page, () => { const c = window.__scTest.isCounted; return [c({ ms: 29999, dur: 200000 }), c({ ms: 30000, dur: 200000 }), c({ ms: 15001, dur: 30000 }), c({ ms: 15000, dur: 30000 })]; })).toEqual([false, true, true, false]);
    // real listening: 2× speed so >15 s of the 30 s song is heard quickly
    await playTrend(page, 0);
    await T(page, () => window.__scTest.setRate(2));
    await page.waitForFunction(() => window.__scTest.PL.cur && window.__scTest.PL.cur.ms > 16500, null, { timeout: 20000 });
    await page.evaluate(() => window.__scMedia("next")); // → counted
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__scMedia("next")); // ~1.5 s → not counted
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__scMedia("pause"));
    let all = await T(page, () => window.__scTest.stLoad());
    expect(all.length).toBe(1); expect(all[0].id).toBe(100); expect(all[0].ms).toBeGreaterThan(15000);
    // older plays for the ranges
    await T(page, async () => { const t = window.__scTest, d = 86400000;
      await t.plCommit({ id: 200, title: "قدیمی", artist: "خواننده دوم", dur: 240000, ms: 120000, at: Date.now() - 10 * d });
      await t.plCommit({ id: 201, title: "خیلی قدیمی", artist: "خواننده دوم", dur: 240000, ms: 240000, at: Date.now() - 40 * d });
      await t.plCommit({ id: 202, title: "رد", artist: "x", dur: 240000, ms: 5000, at: Date.now() }); }); // not counted → not stored
    all = await T(page, () => window.__scTest.stLoad());
    expect(all.length).toBe(3);
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=stats]");
    await expect(page.locator(".stc .stn b >> nth=1")).toHaveText("۱");
    await page.click("[data-act=strange][data-r='30']");
    await expect(page.locator(".stc .stn b >> nth=1")).toHaveText("۲");
    await page.click("[data-act=strange][data-r=all]");
    await expect(page.locator(".stc .stn b >> nth=1")).toHaveText("۳");
    await expect(page.locator(".stc .stn b >> nth=0")).toHaveText("۶"); // 0.3 + 2 + 4 minutes
    await expect(page.locator(".card .it .l").first()).toHaveText("خواننده دوم");
    const posts0 = calls.length;
    await page.click("[data-act=stshare]");
    const share = await T(page, () => window.__nativeCalls.filter((c) => c[0] === "share"));
    expect(share.length).toBe(1); expect(share[0][1]).toContain("آمار من"); expect(share[0][1]).toContain("۶ دقیقه");
    expect(calls.slice(posts0).length).toBe(0); // nothing uploaded
  });
});

// ═════════════════════ 6. one-tap recognition ═════════════════════
const MIC_MOCK = () => {
  window.__mic = { streams: [], ctxs: [] };
  const AC = window.AudioContext;
  window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__mic.ctxs.push(this); } };
  navigator.mediaDevices.getUserMedia = async () => {
    const ac = new AC(), osc = ac.createOscillator(), dst = ac.createMediaStreamDestination();
    osc.connect(dst); osc.start(); window.__mic.streams.push(dst.stream); return dst.stream;
  };
};
const micLive = (page) => page.evaluate(() => ({
  live: window.__mic.streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState !== "ended").length,
  openCtx: window.__mic.ctxs.filter((c) => c.state !== "closed" && c !== window.__scTest.EQ.ctx).length,
}));
const HIT = { title: "Koja Boodi", artist: "Mohsen Chavoshi", cover: null, album: "Album", year: "2019" };
test.describe("recognition", () => {
  test("recognize → best match actions: download and add to a playlist; history keeps the same actions; mic released", async ({ page }) => {
    const calls = [];
    await page.addInitScript(MIC_MOCK);
    await setup(page, { calls, api: (p, req, json) => {
      if (p.startsWith("/recognize")) return json({ hit: HIT, tracks: [track(900, "Koja Boodi", "Mohsen Chavoshi"), track(901, "نسخه دیگر", "x")], matched: 1 });
      if (/^\/playlists\/2\/tracks/.test(p) && req.method() === "POST") return json({ added: true });
    } });
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    await expect(page.locator(".sheet.show .rres h3")).toHaveText("Koja Boodi", { timeout: 15000 });
    expect(await micLive(page)).toEqual({ live: 0, openCtx: 0 }); // stopped as soon as there is a result
    await expect(page.locator(".sheet.show .tr")).toHaveCount(1); // only the real match; plain search results are not shown as "the song"
    await expect(page.locator(".sheet.show .racts .btn")).toHaveCount(5);
    await page.click(".sheet.show .racts [data-act=rdl]");
    await page.click(".sheet.show .dlopt >> nth=0");
    await expect.poll(() => T(page, () => window.__scTest.OFF.ids.has(900)), { timeout: 10000 }).toBe(true);
    // history → add to playlist
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=rechist]");
    await expect(page.locator(".rhe h3")).toHaveText("Koja Boodi");
    await page.click(".rhe .racts [data-act=m_addpl]");
    await page.click(".sheet.show [data-act=m_addto][data-pl='2']");
    await expect.poll(() => calls.includes("/playlists/2/tracks")).toBe(true);
    await page.click(".rhe .racts [data-act=m_fav]");
    await expect.poll(() => calls.filter((c) => c === "/favorites").length).toBeGreaterThan(0);
    await page.click(".rhe .racts [data-act=m_queue]"); // empty queue → plays it
    await playing(page);
    expect((await cur(page)).id).toBe(900);
  });

  test("not on SoundCloud → clear Persian message, no fake result", async ({ page }) => {
    await page.addInitScript(MIC_MOCK);
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) return json({ hit: HIT, tracks: [track(901, "چیز دیگری", "x")], matched: 0 }); } });
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    await expect(page.locator(".sheet.show .rnone b")).toHaveText("این آهنگ توی ساندکلاد پیدا نشد", { timeout: 15000 });
    await expect(page.locator(".sheet.show .tr")).toHaveCount(0);
    await expect(page.locator(".sheet.show .racts")).toHaveCount(0);
    await page.click(".sheet.show [data-act=recsearch]");
    await expect(page.locator("#q")).toHaveValue("Mohsen Chavoshi Koja Boodi");
  });

  test("mic + AudioContext stop on close, navigation and page hide", async ({ page }) => {
    await page.addInitScript(MIC_MOCK);
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/recognize")) return json({ hit: null, tracks: [], matched: 0 }); } });
    await boot(page);
    for (const how of ["close", "nav", "hide"]) {
      await page.click(".nav button[data-tab=search]");
      await page.click(".sinput .mic");
      await page.waitForFunction(() => window.__scTest.REC.stream);
      expect((await micLive(page)).live).toBe(1);
      if (how === "close") { await page.waitForTimeout(450); await page.click(".ov.show", { position: { x: 200, y: 30 } }); } // above the sheet
      if (how === "nav") await T(page, () => window.__scTest.go({ type: "stats" }));
      if (how === "hide") await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
      await expect.poll(() => micLive(page)).toEqual({ live: 0, openCtx: 0 });
      if (how === "hide") await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); });
      await T(page, () => window.__scTest.closeSheet());
      await expect(page.locator(".sheet.show")).toHaveCount(0);
    }
  });
});

// ═════════════════════ 7. sleep timer · speed · EQ ═════════════════════
test.describe("sleep timer, speed, EQ", () => {
  test("timer: UI options, remaining time, cancel; fades over the last 15 s then stops", async ({ page }) => {
    await setup(page);
    await boot(page);
    await playTrend(page, 0);
    await page.click(".mini .meta");
    await page.click("#tsl");
    await expect(page.locator(".sheet.show .slg .chip")).toHaveCount(7);
    await page.click(".sheet.show [data-act=slset][data-m='5']");
    await expect(page.locator("#tsl")).toHaveClass(/on/);
    await expect(page.locator("#tslv")).toHaveText(/^4:5\d$/);
    await page.click("#tsl");
    await expect(page.locator(".sheet.show #slleft")).toContainText("مونده");
    await page.click(".sheet.show [data-act=sloff]");
    await expect(page.locator("#tsl")).not.toHaveClass(/on/);
    // short timer (0.3 min = 18 s) to watch the fade and the stop
    await T(page, () => window.__scTest.sleepSet(0.3));
    await page.waitForTimeout(2000);
    expect(await T(page, () => window.__scTest.SL.vol)).toBe(1);
    await page.waitForTimeout(9000); // ~7 s left → fading
    const v = await T(page, () => window.__scTest.SL.vol);
    expect(v).toBeGreaterThan(0.1); expect(v).toBeLessThan(0.8);
    await page.waitForFunction(() => !window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])).at(-1).playing, null, { timeout: 12000 });
    await page.waitForTimeout(500);
    expect(await T(page, () => window.__scTest.SL.vol)).toBe(1); // volume restored for the next play
    await expect(page.locator(".toast")).toHaveText("تایمر خواب: پخش متوقف شد 🌙");
  });

  test("timer: end of current song stops instead of playing the next one", async ({ page }) => {
    await setup(page);
    await boot(page);
    await playTrend(page, 2);
    await page.click(".mini .meta");
    await page.click("#tsl");
    await page.click(".sheet.show [data-act=slset][data-m=eot]");
    await page.evaluate(() => window.__scMedia("seek", 27000));
    await page.waitForFunction(() => window.__scTest.SL.vol < 1, null, { timeout: 5000 }); // fading at the end of the song
    await page.waitForFunction(() => !window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])).at(-1).playing, null, { timeout: 10000 });
    await page.waitForTimeout(800);
    expect((await cur(page)).qi).toBe(2);
    expect(await T(page, () => window.__scTest.SL.eot)).toBe(false);
  });

  test("speed 0.75× … 2× is really applied", async ({ page }) => {
    await setup(page);
    await boot(page);
    await playTrend(page, 0);
    await page.click(".mini .meta");
    await page.click("#tsp");
    await expect(page.locator(".sheet.show .chip")).toHaveCount(5);
    await page.click(".sheet.show [data-act=spset][data-r='1.5']");
    await expect(page.locator("#tspv")).toHaveText("1.5×");
    // media time heard per wall-clock time (the listening counter integrates currentTime)
    const speed = () => page.evaluate(() => new Promise((res) => { const st = window.__scTest; const a0 = st.PL.cur.ms, w0 = performance.now(); setTimeout(() => res((st.PL.cur.ms - a0) / (performance.now() - w0)), 3000); }));
    const r = await speed();
    expect(r).toBeGreaterThan(1.3); expect(r).toBeLessThan(1.7);
    expect((await media(page)).rate).toBe(1.5); // also reported to the native media session
    await page.click("#tsp"); await page.click(".sheet.show [data-act=spset][data-r='0.75']");
    const r2 = await speed();
    expect(r2).toBeGreaterThan(0.6); expect(r2).toBeLessThan(0.9);
    // survives a song change
    await page.evaluate(() => window.__scMedia("next"));
    await playing(page);
    const r3 = await speed();
    expect(r3).toBeGreaterThan(0.6); expect(r3).toBeLessThan(0.9);
  });

  test("EQ presets really change the audio spectrum", async ({ page }) => {
    await setup(page, { noise: true });
    await boot(page);
    await playTrend(page, 0);
    await page.click(".mini .meta");
    await expect(page.locator("#teq")).toBeVisible();
    await page.click("#teq");
    await expect(page.locator(".sheet.show .eqs .chip")).toHaveCount(4);
    await expect(page.locator(".sheet.show .eqs .chip >> nth=0")).toHaveText("تخت");
    await page.click(".sheet.show [data-act=eqp][data-p=flat]");
    expect(await T(page, () => window.__scTest.eqEnsure())).toBe(true); // flat → graph on demand for the measurement
    const spectrum = () => page.evaluate(() => new Promise((res) => {
      const an = window.__scTest.EQ.an, d = new Float32Array(an.frequencyBinCount), hz = (i) => (i * an.context.sampleRate) / an.fftSize;
      let lo = 0, hi = 0, n = 0;
      const iv = setInterval(() => {
        an.getFloatFrequencyData(d); let l = 0, ln = 0, h = 0, hn = 0;
        d.forEach((v, i) => { const f = hz(i); if (f >= 30 && f <= 60) { l += v; ln++; } if (f >= 14000 && f <= 20000) { h += v; hn++; } });
        lo += l / ln; hi += h / hn;
        if (++n === 12) { clearInterval(iv); res({ lo: lo / n, hi: hi / n, ctx: an.context.state }); }
      }, 80);
    }));
    await page.waitForTimeout(800);
    const flat = await spectrum();
    expect(flat.ctx).toBe("running");
    expect(flat.lo).toBeGreaterThan(-140); // real signal flows through the graph (not silent)
    await page.click(".sheet.show [data-act=eqp][data-p=bass]");
    await page.waitForTimeout(600);
    const bass = await spectrum();
    await page.click(".sheet.show [data-act=eqp][data-p=treble]");
    await page.waitForTimeout(600);
    const treble = await spectrum();
    console.log("EQ spectrum (dB):", JSON.stringify({ flat, bass, treble }));
    expect((bass.lo - bass.hi) - (flat.lo - flat.hi)).toBeGreaterThan(3); // design ≈ +8 dB; measured 4.5–7 dB; noise ±0.5 dB
    expect((treble.hi - treble.lo) - (flat.hi - flat.lo)).toBeGreaterThan(3);
    // manual band
    const before = await spectrum();
    await page.locator(".sheet.show .eqb input >> nth=0").fill("12");
    await page.waitForTimeout(600);
    const man = await spectrum();
    expect(man.lo - before.lo).toBeGreaterThan(2.5);
    expect(await T(page, () => window.__scTest.EQ.preset)).toBe("custom");
    expect(await T(page, () => localStorage.getItem("sc_eq_p"))).toBe("custom");
  });
});
