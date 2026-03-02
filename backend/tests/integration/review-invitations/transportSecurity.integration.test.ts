import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("polish: invitation routes enforce TLS-only transport", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/review-invitations/${ctx.invitationId}`)
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
