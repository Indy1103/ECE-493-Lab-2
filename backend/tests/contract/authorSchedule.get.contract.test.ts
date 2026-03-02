import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { AuthorScheduleResponseSchema } from "../../src/presentation/controllers/authorScheduleController.js";
import { createAuthorScheduleTestApp } from "../integration/author-schedule/testAuthorScheduleApp.js";

test("contract: GET /api/author/schedule returns published schedule payload", async () => {
  const ctx = await createAuthorScheduleTestApp();

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(AuthorScheduleResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
