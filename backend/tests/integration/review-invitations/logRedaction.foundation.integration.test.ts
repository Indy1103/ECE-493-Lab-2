import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("foundation: audit emission redacts sensitive invitation fields", async () => {
  const ctx = await createReviewInvitationTestApp();

  await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(ctx.auditEvents.length > 0, true);
  const event = ctx.auditEvents[0] as Record<string, unknown>;
  assert.equal(event.paperSummary, undefined);
  assert.equal(event.reviewerDisplayName, undefined);

  await ctx.app.close();
});
