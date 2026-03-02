import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  AssignmentOptionsResponseSchema,
  RefereeAssignmentErrorResponseSchema
} from "../../../src/presentation/referee-assignments/refereeAssignmentErrorMapper.js";
import { createRefereeAssignmentTestApp } from "../../integration/referee-assignments/testRefereeAssignmentApp.js";

test("contract: GET assignment options returns 200 payload", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/papers/${ctx.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(AssignmentOptionsResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: GET assignment options returns 401 when unauthenticated", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/v1/papers/${ctx.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(RefereeAssignmentErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: GET assignment options returns 403 when non-editor", async () => {
  const ctx = await createRefereeAssignmentTestApp({ sessionRole: "AUTHOR" });

  const response = await request(ctx.app.server)
    .get(`/api/v1/papers/${ctx.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 403);
  assert.equal(RefereeAssignmentErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
