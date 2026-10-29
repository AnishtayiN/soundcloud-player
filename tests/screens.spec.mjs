// Persian / RTL screenshots of every main screen. Saved to tests/screenshots/ (uploaded as a CI artifact).
// Each screen asserts: <html lang="fa" dir="rtl"> and Persian labels — the UI must stay Persian-first.
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setup, boot, START_URL } from "./harness.mjs";

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
