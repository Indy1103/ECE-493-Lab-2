import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  GetDraftSuccessResponseSchema,
  SubmissionDraftErrorResponseSchema
} from "../../../src/presentation/submission-drafts/submissionDraftErrorMapper.js";
import { createSubmissionDraftTestApp } from "../../integration/submission-drafts/testSubmissionDraftApp.js";

test("contract: get draft returns 200 payload", async () => {
  const ctx = await createSubmissionDraftTestApp();

  await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Resume Draft",
      draftPayload: {
        abstract: "resume"
      }
    });

  const response = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(GetDraftSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: get draft returns 401 when unauthenticated", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(SubmissionDraftErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: get draft returns 403 for non-owner", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.otherSubmissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 403);
  assert.equal(SubmissionDraftErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: get draft returns 404 when absent", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 404);
  assert.equal(SubmissionDraftErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
