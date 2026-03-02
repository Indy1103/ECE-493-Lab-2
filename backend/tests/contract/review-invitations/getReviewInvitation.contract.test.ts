import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  ReviewInvitationErrorResponseSchema,
  ReviewInvitationResponseSchema
} from "../../../src/presentation/review-invitations/reviewInvitationErrorMapper.js";
import { createReviewInvitationTestApp } from "../../integration/review-invitations/testReviewInvitationApp.js";

test("contract: GET review invitation returns 200 payload", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/review-invitations/${ctx.invitationId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(ReviewInvitationResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: GET review invitation returns auth errors", async () => {
  const ctx = await createReviewInvitationTestApp();

  const unauthenticated = await request(ctx.app.server)
    .get(`/api/v1/review-invitations/${ctx.invitationId}`)
    .set("x-forwarded-proto", "https");

  assert.equal(unauthenticated.status, 401);
  assert.equal(ReviewInvitationErrorResponseSchema.safeParse(unauthenticated.body).success, true);

  const unauthorized = await request(ctx.app.server)
    .get(`/api/v1/review-invitations/${ctx.invitationId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.otherSessionId}`);

  assert.equal(unauthorized.status, 403);
  assert.equal(ReviewInvitationErrorResponseSchema.safeParse(unauthorized.body).success, true);

  await ctx.app.close();
});
