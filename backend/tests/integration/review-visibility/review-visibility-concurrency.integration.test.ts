import assert from "node:assert/strict";
import test from "node:test";

import { createReviewVisibilityTestApp } from "./testReviewVisibilityApp.js";

test("concurrency: simultaneous editor visibility requests return consistent review sets", async () => {
  const ctx = await createReviewVisibilityTestApp();

  const responses = await Promise.all(
    Array.from({ length: 12 }, () =>
      ctx.app.inject({
        method: "GET",
        url: `/api/editor/papers/${ctx.paperIds.complete}/reviews`,
        headers: {
          "x-forwarded-proto": "https",
          cookie: `session=${ctx.editorSessionId}`
        }
      })
    )
  );

  for (const response of responses) {
    assert.equal(response.statusCode, 200);

    const body = response.json() as {
      messageCode: string;
      reviews: Array<Record<string, unknown>>;
    };

    assert.equal(body.messageCode, "REVIEWS_VISIBLE");
    assert.equal(body.reviews.length, 2);
    assert.equal("refereeUserId" in body.reviews[0], false);
  }

  await ctx.app.close();
});
