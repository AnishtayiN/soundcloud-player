// P1 regression tests for the shared web UI.
import { test, expect } from "@playwright/test";
import { setup, boot, START_URL, ORIGIN } from "./harness.mjs";

test.use({ viewport: { width: 412, height: 860 } });

// ───────────── search pagination ─────────────
test("load more: two rapid calls never produce duplicate items; one observer at a time", async ({ page }) => {
  const calls = [];
  await page.addInitScript(() => {
    // count live IntersectionObservers
    const IO = window.IntersectionObserver; window.__io = { live: 0, made: 0 };
    window.IntersectionObserver = class extends IO {
      constructor(cb, o) { super(cb, o); window.__io.made++; this.__on = false; }
      observe(t) { if (!this.__on) { this.__on = true; window.__io.live++; } return super.observe(t); }
      disconnect() { if (this.__on) { this.__on = false; window.__io.live--; } return super.disconnect(); }
    };
  });
  await setup(page, { calls, searchDelay: (q, off) => (off ? 400 : 0) });
  await boot(page);
  await page.click(".nav button[data-tab=search]");
  await page.fill("#q", "تکرار");
  await page.press("#q", "Enter");
  await expect(page.locator("#sres .tr")).toHaveCount(20);
  // two rapid "load more" calls
  await page.evaluate(() => { const t = window.__scTest; t.doSearch(t.S.search.q, false, true); t.doSearch(t.S.search.q, false, true); });
  await expect(page.locator("#sres .tr")).toHaveCount(40);
  await page.waitForTimeout(600);
  expect(calls.filter((c) => c.includes("offset=20")).length).toBe(1);
  const ids = await page.evaluate(() => window.__scTest.S.search.items.map((x) => x.id));
  expect(new Set(ids).size).toBe(ids.length);
  // scrolling to the sentinel repeatedly (re-renders) keeps at most one observer alive
  for (let k = 0; k < 4; k++) { await page.mouse.wheel(0, 20000); await page.waitForTimeout(500); }
  const ids2 = await page.evaluate(() => window.__scTest.S.search.items.map((x) => x.id));
  expect(new Set(ids2).size).toBe(ids2.length);
  expect(await page.evaluate(() => window.__io.live)).toBeLessThanOrEqual(1);
});

// ───────────── microphone is always released ─────────────
const MIC_MOCK = () => {
  window.__mic = { streams: [], ctxs: [], gumDelay: 0 };
  const AC = window.AudioContext;
  window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__mic.ctxs.push(this); } };
  navigator.mediaDevices.getUserMedia = async () => {
    if (window.__mic.gumDelay) await new Promise((r) => setTimeout(r, window.__mic.gumDelay));
    const ac = new AC(), osc = ac.createOscillator(), dst = ac.createMediaStreamDestination();
    osc.connect(dst); osc.start();
    window.__mic.streams.push(dst.stream);
    return dst.stream;
  };
};
const micState = (page) => page.evaluate(() => ({
  live: window.__mic.streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState !== "ended").length,
  tracks: window.__mic.streams.flatMap((s) => s.getTracks()).length,
  openCtx: window.__mic.ctxs.filter((c) => c.state !== "closed").length,
  active: window.__scTest.REC.active,
}));
async function startListening(page) {
  await page.click(".nav button[data-tab=search]");
  await page.click(".sinput .mic");
  await page.waitForSelector(".sheet.show .rec");
  await page.waitForFunction(() => window.__mic.streams.length > 0 && window.__scTest.REC.stream);
  await page.waitForTimeout(500);
  const s = await micState(page);
  expect(s.live).toBeGreaterThan(0);
  expect(s.openCtx).toBeGreaterThan(0);
}
const released = async (page) => {
  await page.waitForTimeout(400);
  const s = await micState(page);
  expect(s.live, "mic tracks still live").toBe(0);
  expect(s.openCtx, "AudioContext still open").toBe(0);
  expect(s.active).toBe(false);
};

test.describe("microphone release", () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(MIC_MOCK); await setup(page); await boot(page); });

  test("closing the recognition sheet (overlay tap)", async ({ page }) => {
    await startListening(page);
    await page.click(".ov.show", { position: { x: 20, y: 20 } });
    await released(page);
  });
  test("closing the sheet while the permission prompt is still pending", async ({ page }) => {
    await page.evaluate(() => { window.__mic.gumDelay = 1500; });
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    await page.waitForSelector(".sheet.show .rec");
    await page.evaluate(() => window.__scTest.closeSheet());
    await page.waitForTimeout(2200); // getUserMedia resolves after the sheet is gone
    await released(page);
  });
  test("Android back button", async ({ page }) => {
    await startListening(page);
    expect(await page.evaluate(() => window.__scBack())).toBe(true);
    await released(page);
  });
  test("switching to another tab", async ({ page }) => {
    await startListening(page);
    await page.evaluate(() => document.querySelector(".nav button[data-tab=home]").click());
    await expect(page.locator(".nav button[data-tab=home]")).toHaveClass(/on/);
    await released(page);
  });
  test("another sheet replacing the recognizer (e.g. update prompt)", async ({ page }) => {
    await startListening(page);
    await page.evaluate(() => window.__scTest.openSheet("<div class='x'>x</div>"));
    await released(page);
  });
  test("page hidden (app sent to background)", async ({ page }) => {
    await startListening(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await released(page);
    await expect(page.locator(".sheet.show .rec h3")).toContainText("پیدا نشد");
  });
});

// ───────────── playback survives a renderer crash ─────────────
test("queue, index and position are restored after the renderer is killed", async ({ page, context, browser }) => {
  const calls = [];
  await setup(page, { calls });
  await boot(page);
  await page.waitForSelector("#trend .tr");
  await page.click("#trend .tr >> nth=2");
  await page.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing));
  await page.evaluate(() => window.__scMedia("seek", 12000));
  await page.waitForTimeout(2600);
  const before = await page.evaluate(() => ({ id: window.__scTest.S.queue[window.__scTest.S.qi].id, n: window.__scTest.S.queue.length, qi: window.__scTest.S.qi, saved: window.__scTest.savedPlayer() }));
  expect(before.saved.pos).toBeGreaterThanOrEqual(11);
  expect(before.saved.playing).toBe(true);

  // kill the renderer, then do what MainActivity.onRenderProcessGone() does: a fresh WebView loading START_URL#recover=1
  // what the renderer had already persisted at the moment it dies (no pagehide / unload flush happens on a crash)
  const persisted = await context.storageState();
  const timeout = (ms) => new Promise((r) => setTimeout(() => r("timeout"), ms));
  const crashed = new Promise((r) => page.once("crash", () => r("crash")));
  page.goto("chrome://crash").catch(() => {});
  let how = await Promise.race([crashed, timeout(5000)]);
  if (how !== "crash") { // some headless builds ignore chrome://crash → CDP Page.crash
    const cdp = await context.newCDPSession(page).catch(() => null);
    if (cdp) cdp.send("Page.crash").catch(() => {});
    how = await Promise.race([crashed, timeout(5000)]);
  }
  console.log("renderer:", how);
  // a brand-new WebView (fresh context, only the persisted storage) loading START_URL#recover=1 — like onRenderProcessGone
  const ctx2 = await browser.newContext({ storageState: persisted });
  const page2 = await ctx2.newPage();
  await setup(page2, { calls });
  await page2.goto(START_URL + "#recover=1");
  await page2.waitForSelector(".mini.show");
  await page2.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing && JSON.parse(c[1]).position >= 11000), null, { timeout: 15000 });
  const after = await page2.evaluate(() => ({ id: window.__scTest.S.queue[window.__scTest.S.qi].id, n: window.__scTest.S.queue.length, qi: window.__scTest.S.qi, hash: location.hash }));
  expect(after).toEqual({ id: before.id, n: before.n, qi: before.qi, hash: "" });
  await expect(page2.locator(".mini .t")).toHaveText(await page2.evaluate(() => window.__scTest.S.queue[window.__scTest.S.qi].title));
  await ctx2.close();
});

test("normal restart restores the queue paused, without using the network until play", async ({ page, context }) => {
  const calls = [];
  await setup(page, { calls });
  await boot(page);
  await page.waitForSelector("#trend .tr");
  await page.click("#trend .tr >> nth=1");
  await page.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing));
  await page.evaluate(() => window.__scMedia("seek", 9000));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__scMedia("pause"));
  await page.waitForTimeout(400);
  const title = await page.evaluate(() => window.__scTest.S.queue[window.__scTest.S.qi].title);
  await page.close();
  const page2 = await context.newPage();
  const calls2 = [];
  await setup(page2, { calls: calls2 });
  await page2.goto(START_URL);
  await page2.waitForSelector(".mini.show");
  await expect(page2.locator(".mini .t")).toHaveText(title);
  await page2.waitForTimeout(800);
  expect(calls2.filter((c) => c.startsWith("/stream")).length).toBe(0); // nothing streamed yet
  expect(await page2.evaluate(() => window.__nativeCalls.filter((c) => c[0] === "mediaState").map((c) => JSON.parse(c[1])).some((s) => s.playing))).toBe(false);
  await page2.click("#mpp");
  await page2.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing && JSON.parse(c[1]).position >= 8000), null, { timeout: 15000 });
  expect(calls2.filter((c) => c.startsWith("/stream")).length).toBe(1);
});

// ───────────── native → web messages ─────────────
test("__sc messages are only accepted from our own origin and window", async ({ page }) => {
  await setup(page);
  await page.route("https://evil.test/**", (r) => r.fulfill({ contentType: "text/html", body: `<script>parent.postMessage({__sc:"upd",state:"error",msg:"x"},"*")</script>` }));
  await boot(page);
  await page.evaluate(() => { const f = document.createElement("iframe"); f.src = "https://evil.test/x.html"; document.body.appendChild(f); });
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__scTest.S.upd || null)).toBe(null);
  // same-origin message from our own window (what MainActivity.postToWeb produces) is accepted
  await page.evaluate((o) => window.postMessage({ __sc: "upd", state: "progress", received: 5, total: 10 }, o), ORIGIN);
  await page.waitForFunction(() => window.__scTest.S.upd?.state === "progress");
});

// ───────────── update flow (web side) ─────────────
const REL = (assets) => ({ tag_name: "v9.9.9", assets: assets.map((n) => ({ name: n, size: 2000000, browser_download_url: `https://github.com/AnishtayiN/soundcloud-player/releases/download/v9.9.9/${n}` })) });

test("update: verified download waits for an explicit Install tap", async ({ page }) => {
  test.setTimeout(30000);
  await setup(page, { release: REL(["SoundCloud-Player.apk", "SoundCloud-Player-Setup.exe", "SHA256SUMS"]) });
  await boot(page);
  await page.waitForSelector(".sheet.show .upd", { timeout: 10000 });
  await page.click(".sheet.show [data-act=updstart]");
  const dl = await page.evaluate(() => window.__nativeCalls.find((c) => c[0] === "downloadUpdate"));
  expect(dl[2]).toBe("9.9.9");
  const post = (m) => page.evaluate((m) => window.postMessage(Object.assign({ __sc: "upd" }, m), "https://appassets.androidplatform.net"), m);
  await post({ state: "progress", received: 1000000, total: 2000000 });
  await expect(page.locator(".sheet.show .upd-pct b")).toHaveText("50%");
  await post({ state: "verifying", received: 2000000, total: 2000000 });
  await expect(page.locator(".sheet.show .upd-st")).toContainText("بررسی");
  await post({ state: "done", received: 2000000, total: 2000000 });
  await expect(page.locator(".sheet.show [data-act=updinstall]")).toContainText("نصب");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__nativeCalls.filter((c) => c[0] === "installUpdate").length)).toBe(0); // nothing auto-installs
  await page.click(".sheet.show [data-act=updinstall]");
  expect(await page.evaluate(() => window.__nativeCalls.filter((c) => c[0] === "installUpdate").length)).toBe(1);
  await post({ state: "error", msg: "verify" });
  await expect(page.locator(".sheet.show .upd-err")).toContainText("سالم نبود");
});

test("update: a release without SHA256SUMS is never installed in-app", async ({ page }) => {
  await setup(page, { release: REL(["SoundCloud-Player.apk", "SoundCloud-Player-Setup.exe"]) });
  await boot(page);
  await page.waitForSelector(".sheet.show .upd", { timeout: 10000 });
  await expect(page.locator(".sheet.show [data-act=updstart]")).toHaveCount(0);
  await expect(page.locator(".sheet.show [data-act=updnow]")).toHaveCount(1);
});
