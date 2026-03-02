import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewSubmissionTestApp } from "./testReviewSubmissionApp.js";

test("US1: eligible referee retrieves review form and submits final review successfully", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const formResponse = await request(ctx.app.server)
    .get(`/api/referee/assignments/${ctx.assignmentId}/review-form`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(formResponse.status, 200);
  assert.equal(formResponse.body.fields.length >= 2, true);

  const submitResponse = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({
      responses: {
        summary: "Well-structured paper with strong evaluation.",
        overallScore: 5
      }
    });

  assert.equal(submitResponse.status, 201);
  assert.equal(submitResponse.body.messageCode, "REVIEW_SUBMISSION_ACCEPTED");

  const submissions = ctx.submissionRepository.list();
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0]?.assignmentId, ctx.assignmentId);
  assert.equal(submissions[0]?.status, "SUBMITTED");

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "submitted"), true);

  await ctx.app.close();
});
