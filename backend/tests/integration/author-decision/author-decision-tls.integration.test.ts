import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorDecisionTestApp } from "./testAuthorDecisionApp.js";

test("transport security: HTTP requests are rejected with TLS_REQUIRED", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.outcome, "TLS_REQUIRED");

  await ctx.app.close();
});
