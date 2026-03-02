import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US3: recording failure keeps invitation pending for retry", async () => {
  const ctx = await createReviewInvitationTestApp({ forceNextRecordingFailure: true });

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 500);
  assert.equal(response.body.code, "RESPONSE_RECORDING_FAILED");
  assert.equal(ctx.repository.getAllInvitations()[0]?.invitationStatus, "PENDING");

  await ctx.app.close();
});
