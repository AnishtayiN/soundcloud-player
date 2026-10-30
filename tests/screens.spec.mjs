// Persian / RTL screenshots of every main screen. Saved to tests/screenshots/ (uploaded as a CI artifact).
// Each screen asserts: <html lang="fa" dir="rtl"> and Persian labels — the UI must stay Persian-first.
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setup, boot, track, START_URL } from "./harness.mjs";

const OUT = process.env.SC_SHOTS || path.join(path.dirname(fileURLToPath(import.meta.url)), "screenshots");
fs.mkdirSync(OUT, { recursive: true });

async function rtlFa(page) {
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

test.describe("Persian RTL screens", () => {
  test.use({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1, locale: "fa-IR" });

  test("login", async ({ page }) => {
    await setup(page, { token: false, testHooks: false });
    await page.goto(START_URL);
    await page.waitForSelector(".login .lg-btn");
    await rtlFa(page);
    await expect(page.locator(".lg-btn")).toContainText("ورود با تلگرام");
    await page.waitForTimeout(400);
    await shot(page, "login");
  });

  test("home, search, library, settings, player, offline", async ({ page }) => {
    await setup(page, { testHooks: false });
    await boot(page);
    await page.waitForSelector("#trend .tr");
    await rtlFa(page);
    await expect(page.locator(".nav button[data-tab=home]")).toContainText("خانه");
    await expect(page.locator(".nav button[data-tab=search]")).toContainText("جستجو");
    await page.waitForTimeout(300);
    await shot(page, "home");

    await page.click(".nav button[data-tab=search]");
    await page.fill("#q", "باران");
    await page.press("#q", "Enter");
    await page.waitForSelector("#sres .tr");
    await rtlFa(page);
    await page.waitForTimeout(300);
    await shot(page, "search");

    await page.click(".nav button[data-tab=library]");
    await page.waitForSelector("#pls .pc");
    await rtlFa(page);
    await expect(page.locator(".nav button[data-tab=library]")).toContainText("کتابخانه");
    await page.waitForTimeout(300);
    await shot(page, "library");

    await page.click("#pls .pc[data-act=offopen]");
    await page.waitForSelector(".cover.off");
    await rtlFa(page);
    await expect(page.locator("#view")).toContainText("آفلاین");
    await page.waitForTimeout(300);
    await shot(page, "offline");

    await page.click(".nav button[data-tab=settings]");
    await page.waitForSelector(".card .it");
    await rtlFa(page);
    await expect(page.locator(".nav button[data-tab=settings]")).toContainText("تنظیمات");
    await page.waitForTimeout(300);
    await shot(page, "settings");

    await page.click(".nav button[data-tab=home]");
    await page.click("#trend .tr >> nth=0");
    await page.waitForSelector(".mini .t:not(:empty)");
    await page.click(".mini .meta");
    await page.waitForSelector(".fp.show");
    await rtlFa(page);
    await page.waitForTimeout(700);
    await shot(page, "player");
  });
});

// ── v1.4 screens: queue · lyrics · my stats · downloads · resume banner · sleep timer / EQ · recognition ──
const playing = (page) => page.waitForFunction(() => window.__nativeCalls.some((c) => c[0] === "mediaState" && JSON.parse(c[1]).playing));
const openPlayer = async (page, n = 0) => {
  await page.waitForSelector("#trend .tr");
  await page.click(`#trend .tr >> nth=${n}`);
  await playing(page);
  await page.click(".mini .meta");
  await page.waitForSelector(".fp.show");
};
const LYR = ["شب که می‌رسه، صدای بارون", "یه آهنگ قدیمی تو خیابون", "Every night the city sings", "دلم می‌گیره از این همه دوری", "ولی هنوزم امید دارم", "که یه روز برمی‌گردی", "ستاره‌ها رو می‌شمرم", "تا صبح بیدار می‌مونم", "The morning light will find us", "شب که می‌رسه، صدای بارون"]
  .map((text, i) => ({ t: i * 2500, text }));

test.describe("Persian RTL screens — v1.4", () => {
  test.use({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1, locale: "fa-IR" });

  test("queue", async ({ page }) => {
    await setup(page);
    await boot(page);
    await openPlayer(page, 3);
    await page.click(".fp [data-act=showqueue]");
    await page.waitForSelector(".sheet.show .qrow.cur");
    await rtlFa(page);
    await expect(page.locator(".sheet.show")).toContainText("صف پخش");
    await page.waitForTimeout(500);
    await shot(page, "queue");
  });

  test("lyrics", async ({ page }) => {
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/lyrics/")) return json({ track_id: 100, status: "synced", lines: LYR, text: LYR.map((l) => l.text).join("\n"), source: "LRCLIB", match: { artist: "هنرمند تست", title: "آهنگ 100" } }); } });
    await boot(page);
    await openPlayer(page, 0);
    await page.click("#tly");
    await page.waitForSelector("#lyp .ll.on");
    await page.waitForTimeout(5600); // a few lines in → highlighted + scrolled
    await rtlFa(page);
    await shot(page, "lyrics");
  });

  test("my stats", async ({ page }) => {
    await setup(page);
    await boot(page);
    await page.evaluate(async () => {
      const t = window.__scTest, now = Date.now(), day = 86400000;
      const P = [[1, "گل گلدون", "گوگوش", 210000], [2, "کجا بودی", "محسن چاوشی", 240000], [3, "Blinding Lights", "The Weeknd", 200000], [4, "سلطان قلبم", "عارف", 190000], [5, "دیوونه", "محسن چاوشی", 230000]];
      const plan = [0, 1, 1, 2, 1, 3, 4, 4, 1, 0, 2, 4];
      for (let i = 0; i < plan.length; i++) { const [id, title, artist, dur] = P[plan[i]]; await t.plCommit({ id, title, artist, dur, ms: dur * (0.6 + (i % 4) / 10), at: now - (i % 6) * day - i * 60000 }); }
    });
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=stats]");
    await page.waitForSelector(".stc");
    await rtlFa(page);
    await expect(page.locator("#view")).toContainText("آمار من");
    await expect(page.locator("#view")).toContainText("محسن چاوشی");
    await page.waitForTimeout(400);
    await shot(page, "stats");
  });

  test("downloads", async ({ page }) => {
    await setup(page, { media: async (url, route) => {
      if (url.pathname.includes("/101.wav")) return route.fulfill({ status: 500, body: "x", headers: { "access-control-allow-origin": "*" } });
      if (url.pathname.includes("/102.wav")) { await new Promise((r) => setTimeout(r, 30000)); }
    } });
    await boot(page);
    await page.click(".nav button[data-tab=library]");
    await page.click(".pc[data-act=pl][data-id='2']");
    await page.click(".acts [data-act=pldl]");
    await page.waitForSelector(".sheet.show .dlopt");
    await page.waitForTimeout(300);
    await rtlFa(page);
    await shot(page, "downloads-quality");
    await page.click(".sheet.show .dlopt[data-q=high]");
    await page.evaluate(() => window.__scTest.go({ type: "downloads" }));
    await page.waitForSelector(".tr.dlj.fail");
    await page.waitForSelector(".tr.dlj.run");
    await rtlFa(page);
    await expect(page.locator("#view")).toContainText("دانلودها");
    await page.waitForTimeout(500);
    await shot(page, "downloads");
  });

  test("resume banner", async ({ page }) => {
    const state = { track_id: 104, track: track(104, "آهنگ 104"), position_ms: 83000, duration_ms: 180000, ended: false, device_id: "d-windows-pc-00001", device: "Windows 10", updated_at: Date.now() - 120000 };
    await setup(page, { api: (p, req, json) => { if (p.startsWith("/resume")) return json(req.method() === "POST" ? { applied: false, state, server_time: Date.now() } : { state, server_time: Date.now() }); } });
    await boot(page);
    await page.waitForSelector(".rsm.show", { timeout: 8000 });
    await rtlFa(page);
    await expect(page.locator(".rsm.show b")).toContainText("ادامه از دقیقه‌ی");
    await page.waitForTimeout(500);
    await shot(page, "resume");
  });

  test("sleep timer + speed + EQ", async ({ page }) => {
    await setup(page);
    await boot(page);
    await openPlayer(page, 0);
    await page.click("#tsl");
    await page.click(".sheet.show [data-act=slset][data-m='30']");
    await page.click("#tsp");
    await page.click(".sheet.show [data-act=spset][data-r='1.25']");
    await page.waitForTimeout(500);
    await rtlFa(page);
    await shot(page, "player-tools");
    await page.click("#tsl");
    await page.waitForSelector(".sheet.show #slleft");
    await page.waitForTimeout(400);
    await shot(page, "timer");
    await page.click(".ov.show", { position: { x: 200, y: 40 } }); // close the sheet (timer keeps running)
    await page.waitForTimeout(400);
    await page.click("#teq");
    await page.click(".sheet.show [data-act=eqp][data-p=bass]");
    await page.waitForTimeout(500);
    await expect(page.locator(".sheet.show")).toContainText("اکولایزر");
    await rtlFa(page);
    await shot(page, "eq");
  });

  test("recognition result", async ({ page }) => {
    await page.addInitScript(() => {
      const AC = window.AudioContext;
      navigator.mediaDevices.getUserMedia = async () => { const ac = new AC(), osc = ac.createOscillator(), dst = ac.createMediaStreamDestination(); osc.connect(dst); osc.start(); return dst.stream; };
    });
    await setup(page, { api: (p, req, json) => {
      if (p.startsWith("/recognize")) return json({ hit: { title: "Koja Boodi", artist: "Mohsen Chavoshi", cover: null, album: "Album", year: "2019" }, tracks: [track(900, "Koja Boodi", "Mohsen Chavoshi")], matched: 1 });
    } });
    await boot(page);
    await page.click(".nav button[data-tab=search]");
    await page.click(".sinput .mic");
    await page.waitForSelector(".sheet.show .racts", { timeout: 15000 });
    await rtlFa(page);
    await page.waitForTimeout(500);
    await shot(page, "recognition");
  });
});
