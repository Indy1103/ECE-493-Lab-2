import { expect, test } from "@playwright/test";

test("AT-UC12-02 pending reviews block final decision", async ({ page }) => {
  await page.goto("http://localhost:3000/editor/papers/pending-paper/final-decision");
  await page.getByRole("button", { name: "Reject" }).click();
  await page.getByRole("button", { name: "Submit Final Decision" }).click();
  await expect(page.getByRole("status")).toContainText(/cannot be made yet/i);
});
