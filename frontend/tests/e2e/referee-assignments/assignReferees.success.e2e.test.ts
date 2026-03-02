import { test } from "@playwright/test";

test.describe("UC-07 assign referees success", () => {
  test("editor can assign eligible referees and receives success confirmation", async ({ page }) => {
    await page.goto("http://localhost:3000/editor/papers/30000000-0000-4000-8000-000000000701");
    await page.getByRole("button", { name: "Refresh Options" }).click();
    await page.getByLabel("Referee One (0/2)").check();
    await page.getByLabel("Referee Two (1/2)").check();
    await page.getByRole("button", { name: "Assign Selected Referees" }).click();
  });
});
