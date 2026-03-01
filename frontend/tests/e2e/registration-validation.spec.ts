import { test, expect } from "@playwright/test";

test("registration validation and throttling feedback is explicit", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("Some registration information is invalid or missing.")).toBeVisible();
});
