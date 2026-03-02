import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewVisibilityTestApp } from "./testReviewVisibilityApp.js";

test("US1: eligible editor retrieves anonymized completed reviews", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.complete}/reviews`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.messageCode, "REVIEWS_VISIBLE");
  assert.equal(response.body.completedReviewCount, 2);
  assert.equal(response.body.requiredReviewCount, 2);
  assert.equal(Array.isArray(response.body.reviews), true);
  assert.equal(response.body.reviews.length, 2);
  assert.equal("refereeUserId" in response.body.reviews[0], false);

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "REVIEWS_VISIBLE"), true);

  await ctx.app.close();
});
