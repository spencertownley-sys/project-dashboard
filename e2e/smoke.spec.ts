import { expect, test } from "@playwright/test";

test("overview shows the summary, lanes and needs-you list @phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Portfolio at a glance" })).toBeVisible();
  await expect(page.getByText("Projects tracked")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Needs you" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Spotted Zebra/ }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("projects table filters and opens a project", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Games" }).click();
  await expect(page.getByRole("link", { name: /Smoosh/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /TaskParty/ })).toHaveCount(0);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByLabel("Search projects").fill("framevote");
  await page.getByRole("link", { name: /FrameVote/ }).click();
  await expect(page.getByRole("heading", { name: "FrameVote", level: 1 })).toBeVisible();
  await expect(page.getByText("Cloudflare Worker “shortlist”", { exact: false })).toBeVisible();
});

test("ticking a step lowers hours left, unticking restores it", async ({ page }) => {
  await page.goto("/projects/zebra");
  const meter = page.locator(".meter");
  const before = await meter.textContent();
  expect(before).toContain("6 h left");
  const box = page.getByRole("checkbox", { name: "Fix the “(2027 Guide)” post title" });
  await box.check();
  await expect(meter).toContainText("5.5 h left");
  await box.uncheck();
  await expect(meter).toContainText("6 h left");
});

test("editing a project saves and validates", async ({ page }) => {
  await page.goto("/projects/amanda");
  await page.getByLabel("Complete %").fill("150");
  await page.getByRole("button", { name: "Save changes" }).click();
  // The browser blocks out-of-range values before they reach the server.
  expect(await page.getByLabel("Complete %").evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);
  await page.getByLabel("Complete %").fill("75");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");
  await expect(page.locator(".meter .big")).toHaveText("75%");
});

test("adding a step and an idea", async ({ page }) => {
  const tag = Date.now().toString(36);
  await page.goto("/projects/framevote");
  await page.getByLabel("New step").fill(`Write a privacy page ${tag}`);
  await page.getByLabel("Hours", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Add" }).nth(1).click();
  await expect(page.getByRole("checkbox", { name: `Write a privacy page ${tag}` })).toBeVisible();
  await page.getByRole("button", { name: "Star HEIC support through Cloudflare Images" }).click();
  await expect(page.getByRole("button", { name: "Unstar HEIC support through Cloudflare Images" })).toBeVisible();
  await page.getByRole("button", { name: "Unstar HEIC support through Cloudflare Images" }).click();
  await page.goto("/ideas");
  await page.getByLabel("Idea", { exact: true }).fill(`Mobile app ${tag}`);
  await page.getByRole("button", { name: "Add idea" }).click();
  await expect(page.getByText(`Mobile app ${tag}`)).toBeVisible();
});

test("planner reorders the queue and keeps the order", async ({ page }) => {
  await page.goto("/planner");
  const first = page.locator(".queue li").first();
  await expect(first).toContainText("Spotted Zebra");
  await page.getByRole("button", { name: "Move Spotted Zebra down" }).click();
  await expect(page.locator(".queue li").first()).toContainText("Amanda");
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator(".queue li").first()).toContainText("Amanda");
  await page.getByRole("button", { name: "Move Spotted Zebra up" }).click();
  await page.waitForTimeout(500);
});

test("housekeeping records a decision and can undo it", async ({ page }) => {
  await page.goto("/housekeeping");
  const item = page.locator(".list li", { hasText: "timeline_web_app.py" });
  await item.getByRole("button", { name: "Approve" }).click();
  await expect(item).toContainText("Approved");
  await item.getByRole("button", { name: "Undo" }).click();
  await expect(item.getByRole("button", { name: "Approve" })).toBeVisible();
});

test("infrastructure and cron endpoint", async ({ page, request }) => {
  await page.goto("/infrastructure");
  await expect(page.getByText("2 of 2 active")).toBeVisible();
  await expect(page.getByText("R2 shortlist-photos")).toBeVisible();
  const res = await request.get("/api/cron/sync");
  expect(res.status()).toBe(401);
});
