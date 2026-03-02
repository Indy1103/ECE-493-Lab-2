import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: duplicate referee IDs return explicit duplicate-entry feedback", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1, ctx.refereeIds.r1, ctx.refereeIds.r1] });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");
  assert.equal(response.body.violations.length, 1);
  assert.equal(response.body.violations[0].rule, "DUPLICATE_REFEREE_IN_REQUEST");
  assert.equal(response.body.violations[0].refereeId, ctx.refereeIds.r1);

  await ctx.app.close();
});
