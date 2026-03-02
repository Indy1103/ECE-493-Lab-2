import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "./schedule-edit/testScheduleEditApp.js";

test("US2: invalid modifications are rejected and schedule remains unchanged", async () => {
  const ctx = await createScheduleEditTestApp();

  const before = await ctx.repository.getScheduleForEditor(ctx.conferenceId, ctx.editorUserId);

  const response = await request(ctx.app.server)
    .put(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({
      scheduleId: ctx.scheduleId,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000999",
          sessionId: "22000000-0000-4000-8000-000000000999",
          roomId: "32000000-0000-4000-8000-000000000999",
          timeSlotId: "42000000-0000-4000-8000-000000000999"
        }
      ]
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_MODIFICATIONS");

  const after = await ctx.repository.getScheduleForEditor(ctx.conferenceId, ctx.editorUserId);
  assert.equal(after?.status, before?.status);
  assert.deepEqual(after?.entries, before?.entries);

  const modifications = ctx.modificationRepository.list();
  assert.equal(modifications[0]?.status, "REJECTED");

  await ctx.app.close();
});

test("US2: editor can resubmit revised valid changes after rejection", async () => {
  const ctx = await createScheduleEditTestApp();

  const first = await request(ctx.app.server)
    .put(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({
      scheduleId: ctx.scheduleId,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000999",
          sessionId: "22000000-0000-4000-8000-000000000999",
          roomId: "32000000-0000-4000-8000-000000000999",
          timeSlotId: "42000000-0000-4000-8000-000000000999"
        }
      ]
    });

  assert.equal(first.status, 400);

  const second = await request(ctx.app.server)
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

  assert.equal(second.status, 200);
  assert.equal(second.body.status, "FINAL");

  await ctx.app.close();
});
