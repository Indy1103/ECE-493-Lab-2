import { test, expect } from "@playwright/test";

test("successful login redirects to role home", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("editor.jane");
  await page.getByLabel("Password").fill("Passw0rd88");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/editor\/home/);
});
