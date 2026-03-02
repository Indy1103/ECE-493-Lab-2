import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { ReviewInvitationErrorResponseSchema } from "../../../src/presentation/review-invitations/reviewInvitationErrorMapper.js";
import { createReviewInvitationTestApp } from "../../integration/review-invitations/testReviewInvitationApp.js";

test("contract: POST invitation response maps recording failure to 500 payload", async () => {
  const ctx = await createReviewInvitationTestApp({ forceNextRecordingFailure: true });

  const response = await request(ctx.app.server)
    .post(`/api/v1/review-invitations/${ctx.invitationId}/response`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 500);
  assert.equal(ReviewInvitationErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.code, "RESPONSE_RECORDING_FAILED");

  await ctx.app.close();
});
