import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("auth: missing session is rejected with 401", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "AUTHENTICATION_REQUIRED");

  await ctx.app.close();
});

test("auth: non-editor role is rejected with 403", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.nonEditorSessionId}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "AUTHORIZATION_FAILED");

  await ctx.app.close();
});

test("auth: non-https request is rejected with TLS_REQUIRED", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
