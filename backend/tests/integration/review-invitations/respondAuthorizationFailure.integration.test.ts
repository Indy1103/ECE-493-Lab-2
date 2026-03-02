import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewInvitationTestApp } from "./testReviewInvitationApp.js";

test("polish: unauthenticated and role-mismatched users are rejected", async () => {
  const noSessionCtx = await createReviewInvitationTestApp({ includeSession: false });

  const unauthenticated = await request(noSessionCtx.app.server)
    .post(`/api/v1/review-invitations/${noSessionCtx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .send({ decision: "ACCEPT" });

  assert.equal(unauthenticated.status, 401);
  await noSessionCtx.app.close();

  const wrongRoleCtx = await createReviewInvitationTestApp({ sessionRole: "EDITOR" });

  const roleDenied = await request(wrongRoleCtx.app.server)
    .post(`/api/v1/review-invitations/${wrongRoleCtx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${wrongRoleCtx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(roleDenied.status, 403);
  await wrongRoleCtx.app.close();
});
