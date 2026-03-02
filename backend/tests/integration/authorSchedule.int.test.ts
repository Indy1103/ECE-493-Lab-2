import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorScheduleTestApp } from "./author-schedule/testAuthorScheduleApp.js";

test("UC-16 success: author views published schedule with presentation details", async () => {
  const ctx = await createAuthorScheduleTestApp();

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "FINAL");
  assert.equal(response.body.conferenceId, ctx.conferenceId);
  assert.equal(Array.isArray(response.body.entries), true);
  assert.equal(response.body.entries.length, 2);
  assert.equal(Array.isArray(response.body.authorPresentations), true);
  assert.equal(response.body.authorPresentations.length, 1);

  const notifications = ctx.notificationRepository.list();
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.status, "SENT");

  await ctx.app.close();
});

test("UC-16 denied: author without accepted paper gets generic unavailable response", async () => {
  const ctx = await createAuthorScheduleTestApp({ includeAcceptedPaper: false });

  const response = await request(ctx.app.server)
    .get("/api/author/schedule")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
