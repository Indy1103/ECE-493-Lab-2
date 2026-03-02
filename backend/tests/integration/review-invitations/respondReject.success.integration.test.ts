import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US2: rejecting invitation records rejection and creates no assignment", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 200);
  assert.equal(response.body.invitationStatus, "REJECTED");
  assert.equal(response.body.assignmentCreated, false);
  assert.equal((await ctx.repository.getAssignmentsByReferee(ctx.invitedRefereeId)).length, 0);

  await ctx.app.close();
});
