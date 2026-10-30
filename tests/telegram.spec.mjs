// The same web/app.js inside Telegram (Mini App): no native bridge, auth via initData. v1.4 features must work there too.
import { test, expect } from "@playwright/test";
import { setup, boot } from "./harness.mjs";

test.use({ viewport: { width: 412, height: 860 } });

async function telegram(page, opts = {}) {
  const headers = [];
  await setup(page, { token: false, ...opts, api: (p, req, json) => { headers.push(req.headers()); if (opts.api) return opts.api(p, req, json); } });
  await page.addInitScript(() => {
    delete window.SCNative;
    const noop = () => {};
    window.Telegram = { WebApp: {
      initData: "query_id=AA&user=%7B%22id%22%3A1%2C%22first_name%22%3A%22%D8%A2%D8%B1%D8%B4%22%2C%22language_code%22%3A%22fa%22%7D&auth_date=1&hash=x",
      initDataUnsafe: { user: { id: 1, first_name: "آرش", language_code: "fa" } }, colorScheme: "dark", themeParams: {},
      ready: noop, expand: noop, close: noop, onEvent: noop, setHeaderColor: noop, setBackgroundColor: noop, setBottomBarColor: noop, disableVerticalSwipes: noop,
      BackButton: { show: noop, hide: noop, onClick: noop }, HapticFeedback: { impactOccurred: noop, notificationOccurred: noop },
      openLink: noop, openTelegramLink: noop, showConfirm: (m, cb) => cb(true),
    } };
  });
  return headers;
}

test("Mini App (Telegram): Persian/RTL, initData auth, v1.4 player tools, queue, speed, settings honesty", async ({ page }) => {
  const headers = await telegram(page);
  await boot(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  expect(await page.evaluate(() => !!window.SCNative)).toBe(false);
  expect(headers.some((h) => h["x-init-data"] && h["x-init-data"].includes("auth_date"))).toBe(true);
  expect(headers.some((h) => h["x-app-token"])).toBe(false);

  await page.click("#trend .tr >> nth=2");
  await page.waitForFunction(() => { const t = window.__scTest; return t && !t.audio.paused && t.audio.currentTime > 0.3; });
  await page.click(".mini .meta");
  for (const id of ["#tly", "#tsl", "#tsp", "#teq"]) await expect(page.locator(id)).toBeVisible();
  // queue sheet
  await page.click(".fp [data-act=showqueue]");
  await expect(page.locator(".sheet.show .qrow.cur")).toHaveCount(1);
  await page.click(".ov.show", { position: { x: 200, y: 40 } });
  // speed is real here too
  await page.click("#tsp"); await page.click(".sheet.show [data-act=spset][data-r='1.5']");
  const r = await page.evaluate(() => new Promise((res) => { const a = window.__scTest.audio, a0 = a.currentTime, w0 = performance.now(); setTimeout(() => res((a.currentTime - a0) / ((performance.now() - w0) / 1000)), 2500); }));
  expect(r).toBeGreaterThan(1.3); expect(r).toBeLessThan(1.7);
  // settings: favorites auto-download is off by default; this browser can't tell Wi-Fi from mobile data → says so
  await page.click(".fp [data-act=closefp]");
  await page.click(".nav button[data-tab=settings]");
  await expect(page.locator("[data-act=favauto] .sw")).not.toHaveClass(/on/);
  await expect(page.locator("#favnet")).toContainText("نوع اتصال رو گزارش نمی‌ده");
});
