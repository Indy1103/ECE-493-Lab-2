import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("foundation: invited-referee ownership is enforced", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.otherSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "AUTHORIZATION_FAILED");
  assert.equal(ctx.repository.getAllAssignments().length, 0);

  await ctx.app.close();
});
