import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("get draft returns 404 when no saved draft exists", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "DRAFT_NOT_FOUND");

  await ctx.app.close();
});
