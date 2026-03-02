import { test, expect } from "@playwright/test";

test("retrieval-failure message is distinct from empty-state message", async ({ page }) => {
  await page.goto("/public/announcements?scenario=failure");
  await expect(
    page.getByText("Conference announcements are temporarily unavailable. Please try again.")
  ).toBeVisible();
  await expect(page.getByText("No conference announcements are currently available.")).toHaveCount(0);
});
