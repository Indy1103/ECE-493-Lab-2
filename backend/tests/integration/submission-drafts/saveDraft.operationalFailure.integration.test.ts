import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("operational failure preserves previously saved valid draft", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const saved = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Previous Stable Draft",
      draftPayload: {
        abstract: "stable"
      }
    });

  assert.equal(saved.status, 200);

  ctx.repository.setForceSaveFailure(true);

  const failed = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Should Not Persist",
      draftPayload: {
        abstract: "broken"
      }
    });

  assert.equal(failed.status, 500);
  assert.equal(failed.body.code, "OPERATIONAL_FAILURE");

  const drafts = ctx.repository.getCurrentDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, "Previous Stable Draft");
  assert.equal(drafts[0]?.draftPayload.abstract, "stable");

  await ctx.app.close();
});
