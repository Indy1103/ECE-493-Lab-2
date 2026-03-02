import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { CompletedReviewsResponseSchema } from "../../../src/presentation/review-visibility/error-mapper.js";
import { createReviewVisibilityTestApp } from "../../integration/review-visibility/testReviewVisibilityApp.js";

test("contract: GET /api/editor/papers/{paperId}/reviews returns REVIEWS_VISIBLE payload", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.complete}/reviews`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(CompletedReviewsResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "REVIEWS_VISIBLE");

  await ctx.app.close();
});
