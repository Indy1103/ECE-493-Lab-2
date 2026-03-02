import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  ReviewSubmissionErrorResponseSchema,
  ValidationFailedResponseSchema
} from "../../../src/presentation/review-submission/error-mapper.js";
import { createReviewSubmissionTestApp } from "../../integration/review-submission/testReviewSubmissionApp.js";

test("contract: invalid review payload returns validation-failed response", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({
      responses: {
        summary: "",
        overallScore: 9
      }
    });

  assert.equal(response.status, 400);
  assert.equal(ValidationFailedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "validation-failed");

  await ctx.app.close();
});

test("contract: missing or expired session returns session-expired response", async () => {
  const ctx = await createReviewSubmissionTestApp({ includeSession: false });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .send({ responses: { summary: "x", overallScore: 3 } });

  assert.equal(response.status, 401);
  assert.equal(ReviewSubmissionErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "session-expired");

  await ctx.app.close();
});

test("contract: unavailable submission outcomes use submission-unavailable schema", async () => {
  const ctx = await createReviewSubmissionTestApp({ assignmentOwnerId: "41000000-0000-4000-8000-000000000777" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({ responses: { summary: "x", overallScore: 3 } });

  assert.equal(response.status, 404);
  assert.equal(ReviewSubmissionErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "submission-unavailable");

  await ctx.app.close();
});
