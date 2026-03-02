import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewVisibilityTestApp } from "./testReviewVisibilityApp.js";

test("audit sanitization: emitted events redact review content and referee identifiers", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.complete}/reviews`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 200);

  const events = ctx.auditRepository.list();
  assert.equal(events.length > 0, true);

  const last = events[events.length - 1];
  assert.equal(last?.outcome, "REVIEWS_VISIBLE");
  assert.equal(last?.metadata.reviews, "[REDACTED]");
  assert.equal("refereeUserId" in (last?.metadata ?? {}), false);

  await ctx.app.close();
});
