import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("draft persistence is flagged encrypted-at-rest and backup docs include draft tables", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "At Rest Protected",
      draftPayload: {
        abstract: "encrypted"
      }
    });

  assert.equal(response.status, 200);
  assert.equal(ctx.repository.isEncryptedAtRest(), true);

  const draft = ctx.repository.getCurrentDrafts()[0];
  assert.equal(draft?.encryptedAtRest, true);

  const backupDoc = readFileSync("../infra/ops/backup-restore.md", "utf8");
  assert.equal(backupDoc.includes("submission_drafts"), true);
  assert.equal(backupDoc.includes("draft_snapshots"), true);
  assert.equal(backupDoc.includes("draft_save_attempts"), true);

  await ctx.app.close();
});
