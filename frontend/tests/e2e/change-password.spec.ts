import { test, expect } from "@playwright/test";

test("change password success flow", async ({ page }) => {
  await page.goto("/account/change-password");
  await page.getByLabel("Current Password").fill("Passw0rd88");
  await page.getByLabel("New Password").fill("NewPassw0rd99!");
  await page.getByLabel("Confirm New Password").fill("NewPassw0rd99!");
  await page.getByRole("button", { name: "Change Password" }).click();
  await expect(page.getByText("Please sign in again")).toBeVisible();
});

test("change password invalid submission then retry flow", async ({ page }) => {
  await page.goto("/account/change-password");
  await page.getByLabel("Current Password").fill("WrongCurrent1!");
  await page.getByLabel("New Password").fill("short");
  await page.getByLabel("Confirm New Password").fill("mismatch");
  await page.getByRole("button", { name: "Change Password" }).click();
  await expect(page.getByText("Password change validation failed")).toBeVisible();

  await page.getByLabel("Current Password").fill("Passw0rd88");
  await page.getByLabel("New Password").fill("NewPassw0rd99!");
  await page.getByLabel("Confirm New Password").fill("NewPassw0rd99!");
  await page.getByRole("button", { name: "Change Password" }).click();
  await expect(page.getByText("Please sign in again")).toBeVisible();
});
