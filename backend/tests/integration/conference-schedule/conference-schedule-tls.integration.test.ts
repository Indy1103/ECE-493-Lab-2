import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createConferenceScheduleTestApp } from "./testConferenceScheduleApp.js";

test("transport security: HTTP requests are rejected with TLS_REQUIRED", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 426);
  assert.equal(response.body.outcome, "TLS_REQUIRED");

  await ctx.app.close();
});
