import { expect, test } from "@playwright/test";

test("resume saved draft rehydrates editor fields", async ({ page }) => {
  await page.goto("/author/submission-drafts/10000000-0000-4000-8000-000000000601");
  await page.getByRole("button", { name: "Resume Saved Draft" }).click();
  await expect(page.getByText("Draft loaded successfully.")).toBeVisible();
  await expect(page.getByLabel("Draft Title")).toBeVisible();
  await expect(page.getByLabel("Draft Payload JSON")).toBeVisible();
});
