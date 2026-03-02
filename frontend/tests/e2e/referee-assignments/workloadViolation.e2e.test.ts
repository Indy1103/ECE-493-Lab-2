import { test } from "@playwright/test";

test.describe("UC-07 workload rejection", () => {
  test("editor sees workload violation and can retry", async ({ page }) => {
    await page.goto("http://localhost:3000/editor/papers/30000000-0000-4000-8000-000000000701");
    await page.getByRole("button", { name: "Refresh Options" }).click();
    await page.getByLabel("Referee At Limit (2/2)").check();
    await page.getByRole("button", { name: "Assign Selected Referees" }).click();
    await page.getByLabel("Referee At Limit (2/2)").uncheck();
    await page.getByLabel("Referee One (0/2)").check();
    await page.getByRole("button", { name: "Assign Selected Referees" }).click();
  });
});
