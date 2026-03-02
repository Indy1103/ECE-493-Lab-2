import { test, expect } from "@playwright/test";

test("published registration prices are shown to attendees", async ({ page }) => {
  await page.goto("/registration-prices");
  await expect(page.getByRole("heading", { name: "Conference Registration Prices" })).toBeVisible();
  await expect(page.getByText("student")).toBeVisible();
  await expect(page.getByText("regular")).toBeVisible();
});
