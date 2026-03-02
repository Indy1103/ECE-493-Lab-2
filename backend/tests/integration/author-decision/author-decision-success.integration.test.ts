import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorDecisionTestApp } from "./testAuthorDecisionApp.js";

test("US1: author receives decision when notification is delivered", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.outcome, "DECISION_AVAILABLE");
  assert.equal(response.body.decision, "ACCEPT");

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "DECISION_AVAILABLE"), true);

  await ctx.app.close();
});

test("US1: ownership enforcement returns unavailable for non-owned papers", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.inaccessible}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
