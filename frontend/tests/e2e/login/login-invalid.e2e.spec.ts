import { test, expect } from "@playwright/test";

test("invalid login shows explicit retry guidance", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("editor.jane");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText("Invalid username or password.")).toBeVisible();
});
