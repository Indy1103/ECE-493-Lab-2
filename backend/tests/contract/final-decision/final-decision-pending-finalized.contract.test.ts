import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  DecisionBlockedResponseSchema,
  FinalDecisionErrorResponseSchema
} from "../../../src/presentation/final-decision/error-mapper.js";
import { createFinalDecisionTestApp } from "../../integration/final-decision/testFinalDecisionApp.js";

test("contract: pending reviews return REVIEWS_PENDING payload", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.pending}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 409);
  assert.equal(DecisionBlockedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "REVIEWS_PENDING");

  await ctx.app.close();
});

test("contract: finalized papers return DECISION_FINALIZED payload", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.finalized}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 409);
  assert.equal(DecisionBlockedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "DECISION_FINALIZED");

  await ctx.app.close();
});

test("contract: non-editor access returns generic unavailable/denied", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 403);
  assert.equal(FinalDecisionErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
