import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewSubmissionTestApp } from "./testReviewSubmissionApp.js";

test("US2: invalid payload returns field-level validation issues and no submission record", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({
      responses: {
        summary: "",
        overallScore: 0
      }
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.messageCode, "validation-failed");
  assert.equal(Array.isArray(response.body.issues), true);
  assert.equal(response.body.issues.length >= 2, true);
  assert.equal(ctx.submissionRepository.list().length, 0);

  await ctx.app.close();
});

test("US2: submit-time ineligible assignment returns submission-unavailable without persistence", async () => {
  const ctx = await createReviewSubmissionTestApp({
    invitationStatus: "PENDING",
    submissionEligibility: "INELIGIBLE"
  });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({ responses: { summary: "x", overallScore: 4 } });

  assert.equal(response.status, 409);
  assert.equal(response.body.messageCode, "submission-unavailable");
  assert.equal(response.body.reasonCode, "submit-time-ineligible");
  assert.equal(ctx.submissionRepository.list().length, 0);

  await ctx.app.close();
});

test("US2: non-owned submission attempt returns generic submission-unavailable", async () => {
  const ctx = await createReviewSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.otherSessionId}`)
    .send({ responses: { summary: "x", overallScore: 4 } });

  assert.equal(response.status, 404);
  assert.equal(response.body.messageCode, "submission-unavailable");
  assert.equal(response.body.reasonCode, "non-owned-or-non-assigned");

  await ctx.app.close();
});

test("US2: duplicate final submission is rejected explicitly", async () => {
  const ctx = await createReviewSubmissionTestApp({ seedExistingSubmission: true });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({ responses: { summary: "another", overallScore: 3 } });

  assert.equal(response.status, 409);
  assert.equal(response.body.messageCode, "submission-unavailable");
  assert.equal(response.body.reasonCode, "duplicate-final-submission");

  await ctx.app.close();
});

test("US2: expired session returns session-expired with no submission record", async () => {
  const ctx = await createReviewSubmissionTestApp({ sessionStatus: "EXPIRED" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({ responses: { summary: "x", overallScore: 4 } });

  assert.equal(response.status, 401);
  assert.equal(response.body.messageCode, "session-expired");
  assert.equal(ctx.submissionRepository.list().length, 0);

  await ctx.app.close();
});
