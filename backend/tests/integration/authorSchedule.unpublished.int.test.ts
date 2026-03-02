import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorScheduleTestApp } from "./author-schedule/testAuthorScheduleApp.js";

test("UC-16 unpublished: request returns explicit schedule-not-published message", async () => {
  const ctx = await createAuthorScheduleTestApp({ publishedSchedule: false });

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "SCHEDULE_NOT_PUBLISHED");
  assert.equal(response.body.message, "The final conference schedule is not yet available.");
  assert.equal("entries" in response.body, false);

  await ctx.app.close();
});
