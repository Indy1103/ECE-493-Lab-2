import { test, expect } from "@playwright/test";

test("unavailable registration prices show explicit message", async ({ page }) => {
  await page.goto("/registration-prices");
  await expect(page.getByText("Registration prices are currently unavailable.")).toBeVisible();
});
