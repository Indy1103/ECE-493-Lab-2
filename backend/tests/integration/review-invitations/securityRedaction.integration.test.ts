import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("polish: audit logs avoid sensitive referee data across outcomes", async () => {
  const ctx = await createReviewInvitationTestApp();

  await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  const emission = ctx.auditEvents[0] as Record<string, unknown>;
  assert.equal(typeof emission, "object");
  assert.equal(String(emission.reasonCode).length > 0, true);
  assert.equal(emission.paperSummary, undefined);

  await ctx.app.close();
});
