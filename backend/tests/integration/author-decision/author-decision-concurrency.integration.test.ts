import assert from "node:assert/strict";
import test from "node:test";

import { createAuthorDecisionTestApp } from "./testAuthorDecisionApp.js";

test("concurrency: simultaneous decision reads remain consistent", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      ctx.app.inject({
        method: "GET",
        url: `/api/author/papers/${ctx.paperIds.delivered}/decision`,
        headers: {
          "x-forwarded-proto": "https",
          cookie: `session=${ctx.authorSessionId}`
        }
      })
    )
  );

  assert.equal(responses.every((response) => response.statusCode === 200), true);
  assert.equal(
    responses.every((response) => response.json().outcome === "DECISION_AVAILABLE"),
    true
  );

  await ctx.app.close();
});
