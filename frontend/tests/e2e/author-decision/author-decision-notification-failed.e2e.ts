import { expect, test } from "@playwright/test";

test("AT-UC13-02 notification failed banner is shown", async ({ page }) => {
  await page.goto("http://localhost:3000/author/papers/pending-notification/decision");
  await page.getByRole("button", { name: "Load Decision" }).click();
  await expect(page.getByRole("status")).toContainText(/notification.*failed/i);
});
