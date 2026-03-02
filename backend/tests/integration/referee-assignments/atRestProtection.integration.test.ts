import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: assignment/invitation data is marked protected at rest and covered in backup docs", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  assert.equal(ctx.repository.isEncryptedAtRest(), true);

  const backupDoc = await readFile(
    path.resolve(process.cwd(), "../infra/ops/backup-restore.md"),
    "utf8"
  );

  assert.equal(backupDoc.includes("referee_assignments"), true);
  assert.equal(backupDoc.includes("review_invitations"), true);
  assert.equal(backupDoc.includes("assignment_attempt_audits"), true);

  await ctx.app.close();
});
