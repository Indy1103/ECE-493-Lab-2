import { test, expect } from "@playwright/test";

test("empty-state message is shown when no announcements are available", async ({ page }) => {
  await page.goto("/public/announcements?scenario=empty");
  await expect(page.getByText("No conference announcements are currently available.")).toBeVisible();
});
