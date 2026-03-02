import { test, expect } from "@playwright/test";

test("registration prices page is accessible in Chrome and Firefox", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium" && browserName !== "firefox");

  await page.goto("/registration-prices");
  await expect(page.getByText(/Registration prices|Conference Registration Prices/)).toBeVisible();
});
