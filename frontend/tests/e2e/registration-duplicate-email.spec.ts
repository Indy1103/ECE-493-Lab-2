import { test, expect } from "@playwright/test";

test("duplicate email path shows retry guidance", async ({ page }) => {
  await page.goto("/register?scenario=duplicate");
  await expect(
    page.getByText("This email is already registered. Please use a different email address.")
  ).toBeVisible();
});
