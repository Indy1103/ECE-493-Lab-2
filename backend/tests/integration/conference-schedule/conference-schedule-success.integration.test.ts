import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createConferenceScheduleTestApp } from "./testConferenceScheduleApp.js";

test("US1: admin generates schedule including all accepted papers", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.outcome, "SCHEDULE_GENERATED");
  assert.equal(Array.isArray(response.body.entries), true);
  assert.equal(response.body.entries.length, 2);

  const audits = ctx.auditRepository.list();
  assert.equal(audits.some((event) => event.outcome === "SCHEDULE_GENERATED"), true);

  await ctx.app.close();
});

test("US1: inaccessible conference returns unavailable/denied", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.inaccessible}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
