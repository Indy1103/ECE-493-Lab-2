import { expect, test } from "@playwright/test";

test("AT-UC09-02 referee sees explicit empty-state when no assignments exist", async ({ page }) => {
  await page.goto("http://localhost:3000/referee/assignments");
  await page.getByRole("button", { name: "Refresh Assigned Papers" }).click();
  await expect(page.getByText("No papers are currently assigned for your review.")).toBeVisible();
});
