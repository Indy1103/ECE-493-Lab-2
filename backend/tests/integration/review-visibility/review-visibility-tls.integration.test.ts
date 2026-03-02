import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewVisibilityTestApp } from "./testReviewVisibilityApp.js";

test("transport security: HTTP requests are rejected with TLS_REQUIRED", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/papers/${ctx.paperIds.complete}/reviews`)
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.messageCode, "TLS_REQUIRED");

  await ctx.app.close();
});
