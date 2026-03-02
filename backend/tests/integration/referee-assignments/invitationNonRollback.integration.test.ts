import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("US1: invitation delivery failure does not roll back committed assignments", async () => {
  const ctx = await createRefereeAssignmentTestApp({
    invitationFailureBudgetByReferee: {
      "50000000-0000-4000-8000-000000000702": 1
    }
  });

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1, ctx.refereeIds.r2] });

  assert.equal(response.status, 200);
  assert.equal(
    response.body.invitationStatuses.some(
      (status: { refereeId: string; status: string }) =>
        status.refereeId === ctx.refereeIds.r2 && status.status === "PENDING_RETRY"
    ),
    true
  );
  assert.equal(ctx.repository.getAllAssignments().length, 2);

  await ctx.app.close();
});
