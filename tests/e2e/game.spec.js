import { test, expect } from "@playwright/test";
import { TARGETS } from "../../src/colour.js";
import { SONGS } from "../../src/songs.js";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/?halloween=0");   // Halloween (all of October) has its own tests below
});
test.afterEach(() => expect(errors).toEqual([]));

const pot = (page, k) => page.locator(`.pot[data-k="${k}"]`);

async function pourRecipe(page, rec) {
  for (const [k, n] of Object.entries(rec)) for (let i = 0; i < n; i++) await pot(page, k).click();
}

async function wantedColour(page) {
  const label = await page.locator("#creature").getAttribute("aria-label");
  return TARGETS.find(t => label === `A monster who wants to be ${t.name}`);
}

test("opens on a monster waiting for a colour", async ({ page }) => {
  await expect(page).toHaveTitle("Paint Pots");
  await expect(page.locator(".pot")).toHaveCount(4);
  expect(await wantedColour(page)).toBeTruthy();
  await expect(page.locator("#bowl canvas")).toBeVisible();
});

test("free mix names the colour in the bowl", async ({ page }) => {
  await page.getByRole("button", { name: "Free mix" }).click();
  await expect(page.locator("#name")).toHaveText("Pick a paint!");
  await pot(page, "r").click();
  await expect(page.locator("#name")).toHaveText("red");
  await pot(page, "y").click();
  await expect(page.locator("#name")).toHaveText("orange");
  await page.getByRole("button", { name: "Empty the bowl" }).click();
  await expect(page.locator("#name")).toHaveText("Pick a paint!");
});

test("the hint appears after a few wrong drops", async ({ page }) => {
  const want = await wantedColour(page);
  const wrong = ["r", "y", "b", "w"].find(k => !(k in want.rec));
  for (let i = 0; i < 5; i++) await pot(page, wrong).click();
  await expect(page.locator("#hint .dot")).toHaveCount(Object.keys(want.rec).length);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("painting five monsters starts a concert", async ({ page }) => {
    for (let n = 1; n <= 5; n++) {
      const want = await wantedColour(page);
      await pourRecipe(page, want.rec);
      if (n < 5) {
        await expect(page.locator("#shelf > div")).toHaveCount(n, { timeout: 8000 });
        await expect.poll(async () => (await wantedColour(page))?.name, { timeout: 8000 }).not.toBe(want.name);
      }
    }
    const concert = page.getByRole("dialog", { name: "Monster concert" });
    await expect(concert).toBeVisible({ timeout: 8000 });
    await expect(concert).toContainText(SONGS[0].name);
    await expect(concert.locator(".member")).toHaveCount(5);
    await concert.getByRole("button", { name: "End the concert" }).click();
    await expect(concert).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator("#shelf > div")).toHaveCount(5);
  });
});

test.describe("at Halloween", () => {
  test("the monsters wear costumes", async ({ page }) => {
    await page.goto("/?halloween=1");
    await expect(page.locator("body")).toHaveClass(/halloween/);
    await expect(page.locator("#creature .costume")).toHaveCount(1);
    expect(await wantedColour(page)).toBeTruthy();
  });

  test("is on in October and off the rest of the year", async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 31, 18, 0));
    await page.goto("/");
    await expect(page.locator("#creature .costume")).toHaveCount(1);
    await page.clock.setFixedTime(new Date(2026, 10, 1, 9, 0));
    await page.reload();
    await expect(page.locator("body")).not.toHaveClass(/halloween/);
    await expect(page.locator("#creature .costume")).toHaveCount(0);
  });

  test("the pumpkin switch turns it on and off, and is remembered", async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 4, 12, 10, 0));   // May
    await page.goto("/");
    const spooky = page.getByRole("button", { name: "Halloween" });
    await expect(spooky).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#creature .costume")).toHaveCount(0);
    await spooky.click();
    await expect(spooky).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("body")).toHaveClass(/halloween/);
    await expect(page.locator("#creature .costume")).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole("button", { name: "Halloween" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Halloween" }).click();
    await expect(page.locator("#creature .costume")).toHaveCount(0);
  });

  test("the top bar fits on a small phone", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/?halloween=1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    const title = await page.locator("#title").boundingBox();
    expect(title.height).toBeLessThan(50);   // one line, not a stack of letters
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("a painted monster keeps its costume on the shelf", async ({ page }) => {
      await page.goto("/?halloween=1");
      await pourRecipe(page, (await wantedColour(page)).rec);
      await expect(page.locator("#shelf > div")).toHaveCount(1, { timeout: 8000 });
      await expect(page.locator("#shelf .costume")).toHaveCount(1);
    });
  });
});
