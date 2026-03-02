import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createFinalDecisionTestApp } from "./testFinalDecisionApp.js";

test("transport security: HTTP requests are rejected with TLS_REQUIRED", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 426);
  assert.equal(response.body.outcome, "TLS_REQUIRED");

  await ctx.app.close();
});
