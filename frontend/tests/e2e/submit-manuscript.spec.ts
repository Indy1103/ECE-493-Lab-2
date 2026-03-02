import { expect, test } from "@playwright/test";

test("submit manuscript success path", async ({ page }) => {
  await page.goto("/author/manuscripts/new");
  await page.getByLabel("Manuscript Title").fill("Deterministic Review Workflow");
  await page.getByLabel("Abstract").fill("A practical manuscript submission workflow.");
  await page.getByLabel("Keywords").fill("review, workflow");
  await page.getByLabel("Author Name").fill("Jane Author");
  await page.getByLabel("Corresponding Author Email").fill("jane.author@example.com");
  await page.getByLabel("Primary Subject Area").fill("Software Engineering");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Manuscript submitted successfully")).toBeVisible();
});

test("metadata validation error then correction and retry", async ({ page }) => {
  await page.goto("/author/manuscripts/new");
  await page.getByLabel("Manuscript Title").fill("");
  await page.getByLabel("Abstract").fill("");
  await page.getByLabel("Keywords").fill("");
  await page.getByLabel("Corresponding Author Email").fill("not-an-email");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Metadata validation failed")).toBeVisible();

  await page.getByLabel("Manuscript Title").fill("Resubmission Fix");
  await page.getByLabel("Abstract").fill("Fixed abstract");
  await page.getByLabel("Keywords").fill("systems");
  await page.getByLabel("Author Name").fill("Jane Author");
  await page.getByLabel("Corresponding Author Email").fill("jane.author@example.com");
  await page.getByLabel("Primary Subject Area").fill("Software Engineering");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Manuscript submitted successfully")).toBeVisible();
});

test("invalid file rejected then corrected retry", async ({ page }) => {
  await page.goto("/author/manuscripts/new");
  await page.getByLabel("Manuscript Title").fill("File Validation Retry");
  await page.getByLabel("Abstract").fill("Abstract");
  await page.getByLabel("Keywords").fill("ai");
  await page.getByLabel("Author Name").fill("Jane Author");
  await page.getByLabel("Corresponding Author Email").fill("jane.author@example.com");
  await page.getByLabel("Primary Subject Area").fill("AI");
  await page.getByLabel("Manuscript Media Type").fill("text/plain");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Only PDF manuscript files are allowed")).toBeVisible();

  await page.getByLabel("Manuscript Media Type").fill("application/pdf");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Manuscript submitted successfully")).toBeVisible();
});

test("intake-closed flow shows explicit guidance", async ({ page }) => {
  await page.goto("/author/manuscripts/new?intake=closed");
  await page.getByRole("button", { name: "Submit Manuscript" }).click();
  await expect(page.getByText("Submission intake is closed for the active cycle")).toBeVisible();
});
