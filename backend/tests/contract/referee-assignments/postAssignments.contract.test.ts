import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  AssignRefereesSuccessResponseSchema,
  AssignmentValidationErrorResponseSchema
} from "../../../src/presentation/referee-assignments/refereeAssignmentErrorMapper.js";
import { createRefereeAssignmentTestApp } from "../../integration/referee-assignments/testRefereeAssignmentApp.js";

test("contract: POST assignments returns 200 payload", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      refereeIds: [ctx.refereeIds.r1, ctx.refereeIds.r2]
    });

  assert.equal(response.status, 200);
  assert.equal(AssignRefereesSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: POST assignments returns atomic 400 validation payload", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      refereeIds: [ctx.refereeIds.r1, ctx.refereeIds.r1]
    });

  assert.equal(response.status, 400);
  assert.equal(AssignmentValidationErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(ctx.repository.getAllAssignments().length, 0);

  await ctx.app.close();
});
