import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("polish: UC-09 endpoints reject non-TLS requests", async () => {
  const ctx = await createRefereeAccessTestApp();

  const listResponse = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(listResponse.status, 426);
  assert.equal(listResponse.body.messageCode, "TLS_REQUIRED");

  const accessResponse = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(accessResponse.status, 426);
  assert.equal(accessResponse.body.messageCode, "TLS_REQUIRED");

  await ctx.app.close();
});
