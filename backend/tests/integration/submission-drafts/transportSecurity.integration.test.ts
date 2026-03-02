import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("submission-draft routes enforce TLS-only transport", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const putResponse = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "TLS Required",
      draftPayload: {}
    });

  assert.equal(putResponse.status, 426);
  assert.equal(putResponse.body.code, "TLS_REQUIRED");

  const getResponse = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(getResponse.status, 426);
  assert.equal(getResponse.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
