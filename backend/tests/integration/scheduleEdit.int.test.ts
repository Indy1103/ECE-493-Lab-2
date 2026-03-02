import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("US1: editor retrieves schedule and submits valid modifications", async () => {
  const ctx = await createScheduleEditTestApp();

  const getResponse = await request(ctx.app.server)
    .get(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.status, "DRAFT");

  const putResponse = await request(ctx.app.server)
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

  assert.equal(putResponse.status, 200);
  assert.equal(putResponse.body.status, "FINAL");

  const persisted = await ctx.repository.getScheduleForEditor(ctx.conferenceId, ctx.editorUserId);
  assert.equal(persisted?.status, "FINAL");

  const modifications = ctx.modificationRepository.list();
  assert.equal(modifications.length, 1);
  assert.equal(modifications[0]?.status, "APPLIED");

  await ctx.app.close();
});
