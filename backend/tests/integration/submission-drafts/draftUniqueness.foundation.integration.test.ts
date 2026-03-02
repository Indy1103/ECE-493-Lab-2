import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("foundation: maintains exactly one current draft per author/submission", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const first = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "First draft title",
      draftPayload: {
        abstract: "first"
      }
    });

  assert.equal(first.status, 200);

  const second = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Second draft title",
      draftPayload: {
        abstract: "second"
      }
    });

  assert.equal(second.status, 200);
  assert.equal(ctx.repository.getCurrentDrafts().length, 1);

  await ctx.app.close();
});
