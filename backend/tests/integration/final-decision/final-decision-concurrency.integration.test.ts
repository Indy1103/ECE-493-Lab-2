import assert from "node:assert/strict";
import test from "node:test";

import { createFinalDecisionTestApp } from "./testFinalDecisionApp.js";

test("concurrency: simultaneous decision attempts produce one winner and finalized blocks", async () => {
  const ctx = await createFinalDecisionTestApp();

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      ctx.app.inject({
        method: "POST",
        url: `/api/editor/papers/${ctx.paperIds.complete}/decision`,
        headers: {
          "x-forwarded-proto": "https",
          cookie: `session=${ctx.editorSessionId}`
        },
        payload: { decision: "ACCEPT" }
      })
    )
  );

  const statusCodes = responses.map((response) => response.statusCode);
  assert.equal(statusCodes.includes(200), true);
  assert.equal(statusCodes.filter((status) => status === 200).length, 1);
  assert.equal(statusCodes.filter((status) => status === 409).length, 9);

  const persisted = await ctx.repository.getFinalDecision(ctx.paperIds.complete);
  assert.equal(persisted?.decision, "ACCEPT");

  await ctx.app.close();
});
