import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("validation: malformed payload is rejected with explicit errors", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({
      scheduleId: "not-a-uuid",
      entries: []
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_MODIFICATIONS");
  assert.equal(Array.isArray(response.body.violations), true);

  await ctx.app.close();
});
