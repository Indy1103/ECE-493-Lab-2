import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorScheduleTestApp } from "./author-schedule/testAuthorScheduleApp.js";

test("UC-16 performance: schedule view stays within latency target", async () => {
  const ctx = await createAuthorScheduleTestApp();

  const durations: number[] = [];

  for (let index = 0; index < 20; index += 1) {
    const started = process.hrtime.bigint();
    const response = await request(ctx.app.server)
      .get("/api/author/schedule")
      .set("x-forwarded-proto", "https")
      .set("cookie", `session=${ctx.authorSessionId}`);
    const ended = process.hrtime.bigint();

    assert.equal(response.status, 200);
    durations.push(Number(ended - started) / 1_000_000);
  }

  durations.sort((left, right) => left - right);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1] ?? 0;

  assert.equal(p95 <= 500, true);

  await ctx.app.close();
});
