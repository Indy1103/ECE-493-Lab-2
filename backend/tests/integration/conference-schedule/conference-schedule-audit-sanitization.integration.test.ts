import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createConferenceScheduleTestApp } from "./testConferenceScheduleApp.js";

test("audit sanitization: schedule audit metadata is redacted", async () => {
  const ctx = await createConferenceScheduleTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/admin/conference/${ctx.conferenceIds.withAccepted}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.adminSessionId}`);

  assert.equal(response.status, 200);

  const latest = ctx.auditRepository.list().at(-1);
  assert.equal("paperTitles" in (latest?.metadata ?? {}), false);

  await ctx.app.close();
});
