import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("US1: list assigned papers then access selected assignment successfully", async () => {
  const ctx = await createRefereeAccessTestApp();

  const listResponse = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.messageCode, "ASSIGNMENTS_AVAILABLE");
  assert.equal(Array.isArray(listResponse.body.items), true);
  assert.equal(listResponse.body.items.length > 0, true);

  const accessResponse = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(accessResponse.status, 200);
  assert.equal(accessResponse.body.messageCode, "ACCESS_GRANTED");
  assert.equal(accessResponse.body.paper.paperId, ctx.paperId);
  assert.equal(accessResponse.body.reviewForm.reviewFormId, ctx.reviewFormId);

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "SUCCESS"), true);

  await ctx.app.close();
});
