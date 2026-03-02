import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createFinalDecisionTestApp } from "./testFinalDecisionApp.js";

test("US2: pending reviews block decision recording and no author notification is sent", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.pending}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 409);
  assert.equal(response.body.outcome, "REVIEWS_PENDING");

  const decision = await ctx.repository.getFinalDecision(ctx.paperIds.pending);
  assert.equal(decision, null);

  assert.equal(ctx.authorNotifier.getDispatches().length, 0);

  await ctx.app.close();
});

test("US2: finalized decisions are immutable and return DECISION_FINALIZED", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.finalized}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 409);
  assert.equal(response.body.outcome, "DECISION_FINALIZED");

  const decision = await ctx.repository.getFinalDecision(ctx.paperIds.finalized);
  assert.equal(decision?.decision, "REJECT");

  await ctx.app.close();
});

test("US2: session expired returns explicit SESSION_EXPIRED outcome", async () => {
  const ctx = await createFinalDecisionTestApp({ includeSession: false });

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 401);
  assert.equal(response.body.outcome, "SESSION_EXPIRED");

  await ctx.app.close();
});

test("US2: inaccessible paper returns generic unavailable outcome", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.inaccessible}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 404);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
