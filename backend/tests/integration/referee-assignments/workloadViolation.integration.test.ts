import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("US2: workload-violating referee assignment is rejected atomically", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.atLimit] });

  assert.equal(response.status, 400);
  assert.equal(
    response.body.violations.some((violation: { rule: string }) => violation.rule === "REFEREE_WORKLOAD_LIMIT_REACHED"),
    true
  );
  assert.equal(ctx.repository.getAllAssignments().length, 0);

  await ctx.app.close();
});
