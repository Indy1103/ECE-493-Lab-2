import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorScheduleTestApp } from "./author-schedule/testAuthorScheduleApp.js";

test("UC-16 auth: non-author receives forbidden response", async () => {
  const ctx = await createAuthorScheduleTestApp();

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "AUTHORIZATION_FAILED");

  await ctx.app.close();
});

test("UC-16 auth: missing session receives authentication-required response", async () => {
  const ctx = await createAuthorScheduleTestApp({ includeSession: false });

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");

  await ctx.app.close();
});

test("UC-16 auth: non-https request is rejected with TLS_REQUIRED", async () => {
  const ctx = await createAuthorScheduleTestApp();

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
