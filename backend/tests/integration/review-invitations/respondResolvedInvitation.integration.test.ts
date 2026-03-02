import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US2: non-pending invitation returns explicit validation feedback", async () => {
  const ctx = await createReviewInvitationTestApp({ invitationStatus: "EXPIRED" });

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");
  assert.equal(response.body.violations[0].rule, "INVITATION_NOT_PENDING");

  await ctx.app.close();
});
