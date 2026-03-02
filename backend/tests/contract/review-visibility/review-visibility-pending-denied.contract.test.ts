import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  PendingReviewsResponseSchema,
  ReviewVisibilityErrorResponseSchema
} from "../../../src/presentation/review-visibility/error-mapper.js";
import { createReviewVisibilityTestApp } from "../../integration/review-visibility/testReviewVisibilityApp.js";

test("contract: GET /api/editor/papers/{paperId}/reviews returns REVIEWS_PENDING payload", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.pending}/reviews`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(PendingReviewsResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "REVIEWS_PENDING");
  assert.equal("reviews" in response.body, false);

  await ctx.app.close();
});

test("contract: GET /api/editor/papers/{paperId}/reviews returns UNAVAILABLE_DENIED for non-editor", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.complete}/reviews`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 403);
  assert.equal(ReviewVisibilityErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
