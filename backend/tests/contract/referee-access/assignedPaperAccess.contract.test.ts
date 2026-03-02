import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  AccessGrantedResponseSchema,
  AssignmentListResponseSchema
} from "../../../src/presentation/referee-access/refereeAccessErrorHandler.js";
import { createRefereeAccessTestApp } from "../../integration/referee-access/testRefereeAccessApp.js";

test("contract: GET /api/referee/assignments returns successful assignment list payload", async () => {
  const ctx = await createRefereeAccessTestApp();

  const response = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(AssignmentListResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "ASSIGNMENTS_AVAILABLE");

  await ctx.app.close();
});

test("contract: POST /api/referee/assignments/{assignmentId}/access returns access-granted payload", async () => {
  const ctx = await createRefereeAccessTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(AccessGrantedResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
