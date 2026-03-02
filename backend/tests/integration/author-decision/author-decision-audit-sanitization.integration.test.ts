import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorDecisionTestApp } from "./testAuthorDecisionApp.js";

test("audit sanitization: sensitive fields are redacted", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 200);

  const events = ctx.auditRepository.list();
  const latest = events[events.length - 1];

  assert.equal("authorId" in (latest?.metadata ?? {}), false);
  assert.equal(latest?.metadata.decision, "[REDACTED]");

  await ctx.app.close();
});
