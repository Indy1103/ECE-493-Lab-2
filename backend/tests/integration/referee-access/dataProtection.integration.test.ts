import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("polish: assignment and review-access linkage are protected at rest and covered in backup notes", async () => {
  const ctx = await createRefereeAccessTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(ctx.repository.isEncryptedAtRest(), true);

  const backupDoc = await readFile(
    path.resolve(process.cwd(), "../infra/ops/backup-restore.md"),
    "utf8"
  );
  assert.equal(backupDoc.includes("referee_assignments"), true);
  assert.equal(backupDoc.includes("paper_access_resources"), true);
  assert.equal(backupDoc.includes("review_form_access"), true);
  assert.equal(backupDoc.includes("assigned_paper_access_audits"), true);

  await ctx.app.close();
});
