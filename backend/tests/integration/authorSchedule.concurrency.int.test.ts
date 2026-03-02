import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorScheduleTestApp } from "./author-schedule/testAuthorScheduleApp.js";

test("UC-16 concurrency: parallel author schedule reads remain consistent", async () => {
  const ctx = await createAuthorScheduleTestApp();
  await ctx.app.listen({ port: 0, host: "127.0.0.1" });

  const settled = await Promise.allSettled(
    Array.from({ length: 5 }, () =>
      request(ctx.app.server)
        .get("/api/author/schedule")
        .set("x-forwarded-proto", "https")
        .set("cookie", `session=${ctx.authorSessionId}`)
    )
  );

  const rejected = settled.filter((result) => result.status === "rejected");
  assert.equal(rejected.length, 0);

  const responses = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<any>).value);

  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.body.status, "FINAL");
    assert.equal(Array.isArray(response.body.entries), true);
  }

  const notifications = ctx.notificationRepository.list();
  assert.equal(notifications.length, 1);

  await ctx.app.close();
});
