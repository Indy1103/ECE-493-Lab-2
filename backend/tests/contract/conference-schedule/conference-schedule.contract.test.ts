import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { ScheduleGeneratedResponseSchema } from "../../../src/presentation/conference-schedule/error-mapper.js";
import { createConferenceScheduleTestApp } from "../../integration/conference-schedule/testConferenceScheduleApp.js";

test("contract: POST /api/admin/conference/{conferenceId}/schedule returns SCHEDULE_GENERATED payload", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(ScheduleGeneratedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "SCHEDULE_GENERATED");

  await ctx.app.close();
});
