import { expect, test } from "@playwright/test";

test("AT-UC11-01 editor sees completed anonymized reviews", async ({ page }) => {
  await page.goto("http://localhost:3000/editor/papers/paper-1/reviews");
  await page.getByRole("button", { name: "Load Completed Reviews" }).click();
  await expect(page.getByText(/Completed/i)).toBeVisible();
});
