import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("polish: assigned-paper access path stays at or below p95 <= 5s", async () => {
  const ctx = await createRefereeAccessTestApp();

  const timings: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    const startedAt = performance.now();
    const response = await request(ctx.app.server)
      .post(`/api/referee/assignments/${ctx.assignmentId}/access`)
      .set("x-forwarded-proto", "https")
      .set("cookie", `session=${ctx.sessionId}`);
    const elapsed = performance.now() - startedAt;

    assert.equal(response.status, 200);
    timings.push(elapsed);
  }

  const sorted = [...timings].sort((left, right) => left - right);
  const p95 = sorted[Math.floor(sorted.length * 0.95) - 1] ?? sorted[sorted.length - 1];
  assert.equal(p95 <= 5000, true);

  await ctx.app.close();
});
