import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("foundation: first valid response wins for one invitation", async () => {
  const ctx = await createReviewInvitationTestApp();

  const [first, second] = await Promise.all([
    request(ctx.app.server)
      .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({ decision: "ACCEPT" }),
    request(ctx.app.server)
      .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({ decision: "REJECT" })
  ]);

  const statuses = [first.status, second.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [200, 409]);

  const invitation = ctx.repository.getAllInvitations()[0];
  assert.ok(invitation);
  assert.equal(["ACCEPTED", "REJECTED"].includes(invitation.invitationStatus), true);

  await ctx.app.close();
});
