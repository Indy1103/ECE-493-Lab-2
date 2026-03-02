import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "../integration/schedule-edit/testScheduleEditApp.js";

test("contract: PUT /api/editor/conferences/{conferenceId}/schedule returns 400 for invalid edits", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({
      scheduleId: ctx.scheduleId,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000099",
          sessionId: "22000000-0000-4000-8000-000000000999",
          roomId: "32000000-0000-4000-8000-000000000999",
          timeSlotId: "42000000-0000-4000-8000-000000000999"
        }
      ]
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_MODIFICATIONS");
  assert.equal(Array.isArray(response.body.violations), true);

  await ctx.app.close();
});
