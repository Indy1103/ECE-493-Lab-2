import { expect, test } from "@playwright/test";

test("AT-UC09-03 unavailable and session-expired outcomes show explicit alerts", async ({ page }) => {
  await page.goto("http://localhost:3000/referee/assignments");
  await page.getByRole("button", { name: "Refresh Assigned Papers" }).click();
  await expect(page.getByRole("status")).toContainText(/unavailable|session/i);
});
