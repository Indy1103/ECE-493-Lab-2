import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: invitation retry exhaustion reaches terminal FAILED_FINAL state", async () => {
  const ctx = await createRefereeAssignmentTestApp({
    invitationFailureBudgetByReferee: {
      "50000000-0000-4000-8000-000000000701": 5
    },
    maxRetryAttempts: 2
  });

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1] });

  assert.equal(response.status, 200);
  assert.equal(response.body.invitationStatuses[0].status, "PENDING_RETRY");

  await ctx.invitationDispatchService.retryFailedInvitations();

  const invitations = await ctx.repository.listInvitationsByPaper(ctx.paperId);
  assert.equal(invitations.length, 1);
  assert.equal(invitations[0]?.invitationStatus, "FAILED_FINAL");
  assert.equal(invitations[0]?.failureReasonCode, "RETRY_BUDGET_EXHAUSTED");

  await ctx.app.close();
});
