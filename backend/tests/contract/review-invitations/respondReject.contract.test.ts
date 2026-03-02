import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { ReviewInvitationDecisionSuccessResponseSchema } from "../../../src/presentation/review-invitations/reviewInvitationErrorMapper.js";
import { createReviewInvitationTestApp } from "../../integration/review-invitations/testReviewInvitationApp.js";

test("contract: POST invitation REJECT returns success payload", async () => {
  const ctx = await createReviewInvitationTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 200);
  assert.equal(ReviewInvitationDecisionSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
