import { expect, test } from "@playwright/test";

test("AT-UC13-01 author views available decision", async ({ page }) => {
  await page.goto("http://localhost:3000/author/papers/paper-1/decision");
  await page.getByRole("button", { name: "Load Decision" }).click();
  await expect(page.getByRole("status")).toContainText(/accept|reject/i);
});
