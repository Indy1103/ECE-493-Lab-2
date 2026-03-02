import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("save draft rejects unauthenticated and expired sessions", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const unauthenticated = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .send({
      title: "Draft",
      draftPayload: {}
    });

  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.body.code, "AUTHENTICATION_REQUIRED");

  await ctx.sessionRepository.expireSession(ctx.sessionId);

  const expired = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Draft",
      draftPayload: {}
    });

  assert.equal(expired.status, 401);
  assert.equal(expired.body.code, "AUTHENTICATION_REQUIRED");

  await ctx.app.close();
});
