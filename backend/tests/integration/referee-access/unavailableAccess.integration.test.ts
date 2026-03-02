import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("US3: direct access to non-owned assignment returns generic unavailable-or-not-found", async () => {
  const ctx = await createRefereeAccessTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.otherSessionId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.messageCode, "UNAVAILABLE_OR_NOT_FOUND");
  assert.equal("paper" in response.body, false);
  assert.equal("reviewForm" in response.body, false);

  await ctx.app.close();
});

test("US3: stale or unavailable assignment returns UNAVAILABLE and refreshed list", async () => {
  const ctx = await createRefereeAccessTestApp({ assignmentStatus: "UNAVAILABLE" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.messageCode, "UNAVAILABLE");
  assert.equal(Array.isArray(response.body.items), true);
  assert.equal(
    response.body.items.every((item: { availability: string }) => item.availability === "UNAVAILABLE"),
    true
  );

  await ctx.app.close();
});

test("US3: review-form retrieval failure blocks paper access atomically", async () => {
  const ctx = await createRefereeAccessTestApp({ reviewFormStatus: "UNAVAILABLE" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.messageCode, "UNAVAILABLE");
  assert.equal("paper" in response.body, false);
  assert.equal("reviewForm" in response.body, false);
  assert.equal(response.body.message.includes("no longer available"), true);

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "FORM_UNAVAILABLE"), true);

  await ctx.app.close();
});

test("US3: expired session yields SESSION_EXPIRED and no assignment data disclosure", async () => {
  const ctx = await createRefereeAccessTestApp({ sessionStatus: "EXPIRED" });

  const response = await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 401);
  assert.equal(response.body.messageCode, "SESSION_EXPIRED");
  assert.equal("items" in response.body, false);
  assert.equal("paper" in response.body, false);

  await ctx.app.close();
});
