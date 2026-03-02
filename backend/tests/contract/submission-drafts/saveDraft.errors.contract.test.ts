import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  SaveDraftValidationErrorSchema,
  SubmissionDraftErrorResponseSchema
} from "../../../src/presentation/submission-drafts/submissionDraftErrorMapper.js";
import { createSubmissionDraftTestApp } from "../../integration/submission-drafts/testSubmissionDraftApp.js";

test("contract: save draft returns 400 with validation violations", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "",
      draftPayload: {}
    });

  assert.equal(response.status, 400);
  assert.equal(SaveDraftValidationErrorSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: save draft returns 401 when unauthenticated", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .send({
      title: "Draft",
      draftPayload: {}
    });

  assert.equal(response.status, 401);
  assert.equal(SubmissionDraftErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: save draft returns 403 when not submission owner", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.otherSubmissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Draft",
      draftPayload: {}
    });

  assert.equal(response.status, 403);
  assert.equal(SubmissionDraftErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
