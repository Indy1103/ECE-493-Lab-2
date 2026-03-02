import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("foundation: rejects save/get attempts when authenticated user is not owner", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const saveResponse = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.otherSubmissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Blocked draft",
      draftPayload: {}
    });

  assert.equal(saveResponse.status, 403);
  assert.equal(saveResponse.body.code, "AUTHORIZATION_FAILED");

  const getResponse = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.otherSubmissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(getResponse.status, 403);
  assert.equal(getResponse.body.code, "AUTHORIZATION_FAILED");

  await ctx.app.close();
});
