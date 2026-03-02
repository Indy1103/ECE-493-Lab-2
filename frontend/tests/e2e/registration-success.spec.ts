import { test, expect } from "@playwright/test";

test("registration success flow shows login-ready confirmation", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full Name").fill("Alex Johnson");
  await page.getByLabel("Email").fill("alex.johnson@example.com");
  await page.getByLabel("Password").fill("Passw0rd88");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("Account created successfully. You can now log in.")).toBeVisible();
});
