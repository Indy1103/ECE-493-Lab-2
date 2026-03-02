import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("foundation: title baseline validation rejects empty title", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "   ",
      draftPayload: {}
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");
  assert.equal(Array.isArray(response.body.violations), true);
  assert.equal(ctx.repository.getCurrentDrafts().length, 0);

  await ctx.app.close();
});
