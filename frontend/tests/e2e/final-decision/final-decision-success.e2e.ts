import { expect, test } from "@playwright/test";

test("AT-UC12-01 editor records final decision", async ({ page }) => {
  await page.goto("http://localhost:3000/editor/papers/paper-1/final-decision");
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByRole("button", { name: "Submit Final Decision" }).click();
  await expect(page.getByRole("status")).toContainText(/decision recorded/i);
});
