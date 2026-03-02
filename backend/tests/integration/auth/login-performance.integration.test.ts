import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("performance validation stays under p95 <= 1.0s for simulated load", async () => {
  const ctx = await createLoginTestApp();

  const timings: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    const startedAt = performance.now();
    const response = await request(ctx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .send({ username: "editor.jane", password: "Passw0rd88" });
    const elapsed = performance.now() - startedAt;

    assert.equal(response.status, 200);
    timings.push(elapsed);
  }

  const sorted = [...timings].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95) - 1] ?? sorted[sorted.length - 1];
  assert.equal(p95 <= 1000, true);

  await ctx.app.close();
});
