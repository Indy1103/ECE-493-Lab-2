import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("save draft rejects non-owner access with explicit guidance", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.otherSubmissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Not Allowed",
      draftPayload: {}
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "AUTHORIZATION_FAILED");
  assert.equal(ctx.repository.getCurrentDrafts().length, 0);

  await ctx.app.close();
});
