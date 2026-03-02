import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createConferenceScheduleTestApp } from "./testConferenceScheduleApp.js";

test("US2: no accepted papers returns explicit blocking outcome", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.noAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.outcome, "NO_ACCEPTED_PAPERS");

  await ctx.app.close();
});

test("US2: missing session returns SESSION_EXPIRED", async () => {
  const ctx = await createConferenceScheduleTestApp({ includeSession: false });

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(response.body.outcome, "SESSION_EXPIRED");

  await ctx.app.close();
});
