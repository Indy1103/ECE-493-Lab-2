import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { DecisionRecordedResponseSchema } from "../../../src/presentation/final-decision/error-mapper.js";
import { createFinalDecisionTestApp } from "../../integration/final-decision/testFinalDecisionApp.js";

test("contract: POST /api/editor/papers/{paperId}/decision returns DECISION_RECORDED payload", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 200);
  assert.equal(DecisionRecordedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "DECISION_RECORDED");

  await ctx.app.close();
});
