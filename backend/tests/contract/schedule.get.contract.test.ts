import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createScheduleEditTestApp } from "../integration/schedule-edit/testScheduleEditApp.js";

test("contract: GET /api/editor/conferences/{conferenceId}/schedule returns schedule payload", async () => {
  const ctx = await createScheduleEditTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/editor/conferences/${ctx.conferenceId}/schedule`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.id, "string");
  assert.equal(response.body.conferenceId, ctx.conferenceId);
  assert.equal(response.body.status, "DRAFT");
  assert.equal(Array.isArray(response.body.entries), true);
  assert.equal(response.body.entries.length, 2);

  await ctx.app.close();
});
