import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { RefereeAccessErrorResponseSchema } from "../../../src/presentation/referee-access/refereeAccessErrorHandler.js";
import { createRefereeAccessTestApp } from "../../integration/referee-access/testRefereeAccessApp.js";

test("contract: direct non-owned assignment access returns 404 UNAVAILABLE_OR_NOT_FOUND", async () => {
  const ctx = await createRefereeAccessTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.otherSessionId}`);

  assert.equal(response.status, 404);
  assert.equal(RefereeAccessErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "UNAVAILABLE_OR_NOT_FOUND");

  await ctx.app.close();
});

test("contract: unavailable assignment access returns 409 UNAVAILABLE", async () => {
  const ctx = await createRefereeAccessTestApp({ assignmentStatus: "UNAVAILABLE" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 409);
  assert.equal(RefereeAccessErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "UNAVAILABLE");

  await ctx.app.close();
});

test("contract: expired session returns 401 SESSION_EXPIRED", async () => {
  const ctx = await createRefereeAccessTestApp({ sessionStatus: "EXPIRED" });

  const listResponse = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(listResponse.status, 401);
  assert.equal(RefereeAccessErrorResponseSchema.safeParse(listResponse.body).success, true);
  assert.equal(listResponse.body.messageCode, "SESSION_EXPIRED");

  const accessResponse = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(accessResponse.status, 401);
  assert.equal(RefereeAccessErrorResponseSchema.safeParse(accessResponse.body).success, true);
  assert.equal(accessResponse.body.messageCode, "SESSION_EXPIRED");

  await ctx.app.close();
});
