import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US3: recording failure leaves no assignment side effects", async () => {
  const ctx = await createReviewInvitationTestApp({ forceNextRecordingFailure: true });

  await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal((await ctx.repository.getAssignmentsByInvitation(ctx.invitationId)).length, 0);

  await ctx.app.close();
});
