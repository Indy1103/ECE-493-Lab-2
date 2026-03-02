import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { AuthorScheduleErrorSchema } from "../../src/presentation/controllers/authorScheduleController.js";
import { createAuthorScheduleTestApp } from "../integration/author-schedule/testAuthorScheduleApp.js";

test("contract: GET /api/author/schedule returns 409 when schedule is unpublished", async () => {
  const ctx = await createAuthorScheduleTestApp({ publishedSchedule: false });

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(AuthorScheduleErrorSchema.safeParse(response.body).success, true);
  assert.equal(response.body.code, "SCHEDULE_NOT_PUBLISHED");

  await ctx.app.close();
});
