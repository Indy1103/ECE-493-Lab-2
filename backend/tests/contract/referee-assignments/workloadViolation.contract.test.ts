import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { AssignmentValidationErrorResponseSchema } from "../../../src/presentation/referee-assignments/refereeAssignmentErrorMapper.js";
import { createRefereeAssignmentTestApp } from "../../integration/referee-assignments/testRefereeAssignmentApp.js";

test("contract: workload violation maps to 400 validation payload", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.atLimit] });

  assert.equal(response.status, 400);
  assert.equal(AssignmentValidationErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(
    response.body.violations.some((violation: { rule: string }) => violation.rule === "REFEREE_WORKLOAD_LIMIT_REACHED"),
    true
  );

  await ctx.app.close();
});
