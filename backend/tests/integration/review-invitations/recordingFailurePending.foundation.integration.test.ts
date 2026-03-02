import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("foundation: recording failure keeps invitation unresolved", async () => {
  const ctx = await createReviewInvitationTestApp({ forceNextRecordingFailure: true });

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 500);
  const invitation = ctx.repository.getAllInvitations()[0];
  assert.equal(invitation?.invitationStatus, "PENDING");
  assert.equal(ctx.repository.getAllAssignments().length, 0);

  await ctx.app.close();
});
