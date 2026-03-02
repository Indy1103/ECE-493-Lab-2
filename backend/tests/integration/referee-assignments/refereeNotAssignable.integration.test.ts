import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: invalid or non-assignable referee IDs are rejected atomically", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const unknown = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.unknown] });

  assert.equal(unknown.status, 400);
  assert.equal(
    unknown.body.violations.some((violation: { rule: string }) => violation.rule === "REFEREE_NOT_ASSIGNABLE"),
    true
  );

  const ineligible = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.ineligible] });

  assert.equal(ineligible.status, 400);
  assert.equal(ctx.repository.getAllAssignments().length, 0);

  await ctx.app.close();
});
