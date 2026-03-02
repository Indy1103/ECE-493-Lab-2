import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  ReviewFormResponseSchema,
  ReviewSubmissionSuccessResponseSchema
} from "../../../src/presentation/review-submission/error-mapper.js";
import { createReviewSubmissionTestApp } from "../../integration/review-submission/testReviewSubmissionApp.js";

test("contract: GET /api/referee/assignments/{assignmentId}/review-form returns REVIEW_FORM_AVAILABLE payload", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/referee/assignments/${ctx.assignmentId}/review-form`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(ReviewFormResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "REVIEW_FORM_AVAILABLE");

  await ctx.app.close();
});

test("contract: POST /api/referee/assignments/{assignmentId}/review-submissions returns REVIEW_SUBMISSION_ACCEPTED payload", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({
      responses: {
        summary: "Solid contribution with clear methodology.",
        overallScore: 4
      }
    });

  assert.equal(response.status, 201);
  assert.equal(ReviewSubmissionSuccessResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "REVIEW_SUBMISSION_ACCEPTED");

  await ctx.app.close();
});
