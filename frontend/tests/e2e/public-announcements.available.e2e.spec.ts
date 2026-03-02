import { test, expect } from "@playwright/test";

test("anonymous users can read available conference announcements", async ({ page }) => {
  await page.goto("/public/announcements");
  await expect(page.getByRole("heading", { name: "Conference Announcements" })).toBeVisible();
  await expect(page.getByText("Announcements available.")).toBeVisible();
});
