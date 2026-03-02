import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "../integration/schedule-edit/testScheduleEditApp.js";

test("contract: PUT /api/editor/conferences/{conferenceId}/schedule updates and finalizes", async () => {
  const ctx = await createScheduleEditTestApp();

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

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "FINAL");
  assert.equal(response.body.conferenceId, ctx.conferenceId);
  assert.equal(response.body.entries[0].sessionId, "21000000-0000-4000-8000-000000000003");

  await ctx.app.close();
});
