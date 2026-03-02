import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US1: accepting invitation records acceptance and creates assignment", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 200);
  assert.equal(response.body.invitationStatus, "ACCEPTED");
  assert.equal(response.body.assignmentCreated, true);
  assert.equal((await ctx.repository.getAssignmentsByReferee(ctx.invitedRefereeId)).length, 1);

  await ctx.app.close();
});
