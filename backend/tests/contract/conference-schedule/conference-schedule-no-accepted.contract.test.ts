import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  NoAcceptedPapersResponseSchema,
  ConferenceScheduleErrorResponseSchema
} from "../../../src/presentation/conference-schedule/error-mapper.js";
import { createConferenceScheduleTestApp } from "../../integration/conference-schedule/testConferenceScheduleApp.js";

test("contract: no accepted papers returns NO_ACCEPTED_PAPERS payload", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.noAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(NoAcceptedPapersResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "NO_ACCEPTED_PAPERS");

  await ctx.app.close();
});

test("contract: non-admin access returns generic unavailable/denied", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.nonAdminSessionId}`);

  assert.equal(response.status, 403);
  assert.equal(ConferenceScheduleErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
