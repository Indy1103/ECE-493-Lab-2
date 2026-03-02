import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("US3: later response is rejected with conflict after first valid response", async () => {
  const ctx = await createReviewInvitationTestApp();

  const first = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  const second = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.equal(second.body.code, "INVITATION_ALREADY_RESOLVED");

  await ctx.app.close();
});
