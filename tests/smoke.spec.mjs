// P0 smoke test: boots web/app.js in headless Chromium (as the Android app sees it) and checks that
//  • the home screen renders,
//  • search goes through searchSeq (a slower, older response can never overwrite a newer one),
//  • applyLang() sets dir="rtl" for fa (the default) and dir="ltr" for en.
import { test, expect } from "@playwright/test";
import { setup, boot } from "./harness.mjs";

test.use({ viewport: { width: 412, height: 860 } });

test("home screen renders (Persian, RTL by default)", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await setup(page);
  await boot(page);
  await expect(page.locator(".hdr h1")).toContainText("سلام");
  await expect(page.locator("#trend .tr")).toHaveCount(12);
  await expect(page.locator("#topBox .tr").first()).toBeVisible();
  await expect(page.locator(".nav button[data-tab=home]")).toHaveClass(/on/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  expect(await page.evaluate(() => localStorage.getItem("sc_lang"))).toBe("fa"); // native default is fa
  expect(errors).toEqual([]);
});

test("applyLang(): fa → rtl, en → ltr (and the settings toggle round-trips)", async ({ page }) => {
  await setup(page);
  await boot(page);
  expect(await page.evaluate(() => window.__scTest.applyLang("fa"))).toBe("rtl");
  expect(await page.evaluate(() => window.__scTest.applyLang("en"))).toBe("ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(await page.evaluate(() => window.__scTest.applyLang("fa"))).toBe("rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");

  await page.click(".nav button[data-tab=settings]");
  await page.click("[data-act=setlang]");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator(".nav button[data-tab=settings]")).toContainText("Settings");
  await page.click("[data-act=setlang]");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".nav button[data-tab=settings]")).toContainText("تنظیمات");
});

test("search uses searchSeq: a stale (slower) response never replaces the newer one", async ({ page }) => {
  const calls = [];
  await setup(page, { calls, searchDelay: (q) => (q.includes("کند") ? 1500 : 50) });
  await boot(page);
  await page.click(".nav button[data-tab=search]");
  const seq0 = await page.evaluate(() => window.__scTest.searchSeq());
  await page.fill("#q", "آهنگ کند");          // debounced search #1 (slow response)
  await page.waitForTimeout(600);
  await page.fill("#q", "آهنگ تند");          // search #2 (fast response) while #1 is still in flight
  await page.press("#q", "Enter");
  await expect(page.locator("#sres .tr").first()).toContainText("آهنگ تند");
  await page.waitForTimeout(1800);            // let the slow response arrive
  await expect(page.locator("#sres .tr").first()).toContainText("آهنگ تند");
  await expect(page.locator("#sres")).not.toContainText("آهنگ کند");
  expect(await page.evaluate(() => window.__scTest.searchSeq())).toBe(seq0 + 2);
  expect(calls.filter((c) => c.startsWith("/search")).length).toBe(2);
});
