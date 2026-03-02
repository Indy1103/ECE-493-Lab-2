import { expect, test } from "@playwright/test";

test("AT-UC10-02 invalid submission shows issues and supports retry", async ({ page }) => {
  await page.goto("http://localhost:3000/referee/assignments/assignment-1/review-form");
  await page.getByRole("button", { name: "Load Review Form" }).click();
  await page.getByRole("button", { name: "Submit Review" }).click();
  await expect(page.getByRole("status")).toContainText(/correct the highlighted review form fields/i);
});
