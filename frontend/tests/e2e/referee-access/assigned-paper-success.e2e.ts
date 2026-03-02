import { expect, test } from "@playwright/test";

test("AT-UC09-01 referee can list and access assigned paper with review form", async ({ page }) => {
  await page.goto("http://localhost:3000/referee/assignments");
  await page.getByRole("button", { name: "Refresh Assigned Papers" }).click();
  await page.getByRole("button", { name: "Access Paper" }).first().click();
  await expect(page.getByText("Paper URL:")).toBeVisible();
  await expect(page.getByText("Review Form URL:")).toBeVisible();
});
