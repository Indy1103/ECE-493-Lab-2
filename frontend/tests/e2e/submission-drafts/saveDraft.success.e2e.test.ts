import { expect, test } from "@playwright/test";

test("save draft success shows explicit confirmation", async ({ page }) => {
  await page.goto("/author/submission-drafts/10000000-0000-4000-8000-000000000601");
  await page.getByLabel("Draft Title").fill("Incremental Draft");
  await page.getByLabel("Draft Payload JSON").fill('{"abstract":"working draft"}');
  await page.getByRole("button", { name: "Save Draft" }).click();
  await expect(page.getByText("Draft saved successfully.")).toBeVisible();
});
