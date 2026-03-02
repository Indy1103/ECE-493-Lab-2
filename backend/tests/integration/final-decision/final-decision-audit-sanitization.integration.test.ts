import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createFinalDecisionTestApp } from "./testFinalDecisionApp.js";

test("audit sanitization: decision payload and sensitive fields are redacted", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 200);

  const events = ctx.auditRepository.list();
  const latest = events[events.length - 1];

  assert.equal(latest?.outcome, "DECISION_RECORDED");
  assert.equal(latest?.metadata.requestPayload, "[REDACTED]");
  assert.equal("authorUserId" in (latest?.metadata ?? {}), false);

  await ctx.app.close();
});
