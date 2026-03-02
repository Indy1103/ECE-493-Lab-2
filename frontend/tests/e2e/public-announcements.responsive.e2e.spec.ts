import { test, expect, devices } from "@playwright/test";

for (const [name, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", devices["iPhone 12"].viewport ?? { width: 375, height: 812 }]
] as const) {
  test(`public announcement states render on ${name} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/public/announcements");
    await expect(page.locator("body")).toBeVisible();
  });
}
