import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("US1: valid multi-referee assignment commits atomically", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1, ctx.refereeIds.r2] });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.assignedRefereeIds, [ctx.refereeIds.r1, ctx.refereeIds.r2]);
  assert.equal(ctx.repository.getAllAssignments().length, 2);
  assert.equal(ctx.repository.getAllInvitations().length, 2);

  await ctx.app.close();
});
