import { expect, test } from "@playwright/test";

test("invalid draft save shows explicit validation guidance", async ({ page }) => {
  await page.goto("/author/submission-drafts/10000000-0000-4000-8000-000000000601");
  await page.getByLabel("Draft Title").fill("");
  await page.getByLabel("Draft Payload JSON").fill("{not-json}");
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText("Draft payload must be valid JSON.")).toBeVisible();
});
