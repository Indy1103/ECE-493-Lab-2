import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { DecisionAvailableResponseSchema } from "../../../src/presentation/author-decision/error-mapper.js";
import { createAuthorDecisionTestApp } from "../../integration/author-decision/testAuthorDecisionApp.js";

test("contract: GET /api/author/papers/{paperId}/decision returns DECISION_AVAILABLE payload", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(DecisionAvailableResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "DECISION_AVAILABLE");

  await ctx.app.close();
});
