import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("save draft success: persists current draft and returns explicit confirmation", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Valid Draft Title",
      draftPayload: {
        abstract: "Initial abstract",
        keywords: ["systems", "reviews"]
      }
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Draft saved successfully.");
  assert.equal(response.body.submissionId, ctx.submissionId);

  const drafts = ctx.repository.getCurrentDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, "Valid Draft Title");
  assert.equal(drafts[0]?.policyVersion, "CMS Draft Submission Policy v1.0");

  const snapshots = ctx.repository.getSnapshots();
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.version, 1);

  await ctx.app.close();
});
