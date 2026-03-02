import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("performance: valid update completes within 5 seconds", async () => {
  const ctx = await createScheduleEditTestApp();
  const startedAt = Date.now();

  const response = await request(ctx.app.server)
    .put(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({
      scheduleId: ctx.scheduleId,
      entries: [
        {
          paperId: ctx.validEntries[0]!.paperId,
          sessionId: "21000000-0000-4000-8000-000000000003",
          roomId: "31000000-0000-4000-8000-000000000003",
          timeSlotId: "41000000-0000-4000-8000-000000000003"
        },
        ctx.validEntries[1]
      ]
    });

  const elapsedMs = Date.now() - startedAt;

  assert.equal(response.status, 200);
  assert.equal(elapsedMs < 5000, true);

  await ctx.app.close();
});
