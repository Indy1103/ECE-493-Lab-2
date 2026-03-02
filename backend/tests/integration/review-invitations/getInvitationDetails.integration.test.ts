import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US1: invitation details include minimum decision context fields", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/review-invitations/${ctx.invitationId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.paperTitle, "string");
  assert.equal(typeof response.body.paperSummary, "string");
  assert.equal(typeof response.body.reviewDueAt, "string");
  assert.equal(typeof response.body.responseDeadlineAt, "string");

  await ctx.app.close();
});
