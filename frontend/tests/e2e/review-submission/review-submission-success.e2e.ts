import { expect, test } from "@playwright/test";

test("AT-UC10-01 eligible referee submits a completed review", async ({ page }) => {
  await page.goto("http://localhost:3000/referee/assignments/assignment-1/review-form");
  await page.getByRole("button", { name: "Load Review Form" }).click();
  await page.getByRole("button", { name: "Submit Review" }).click();
  await expect(page.getByRole("status")).toContainText(/submitted successfully/i);
});
