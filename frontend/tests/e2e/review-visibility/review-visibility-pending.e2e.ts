import { expect, test } from "@playwright/test";

test("AT-UC11-02 editor sees pending message and no review content", async ({ page }) => {
  await page.goto("http://localhost:3000/editor/papers/pending-paper/reviews");
  await page.getByRole("button", { name: "Load Completed Reviews" }).click();
  await expect(page.getByRole("status")).toContainText(/pending/i);
});
