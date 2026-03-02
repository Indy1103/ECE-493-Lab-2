import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: failure responses and audit events do not expose sensitive referee fields", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.unknown] });

  assert.equal(response.status, 400);

  const responseBody = JSON.stringify(response.body);
  assert.equal(responseBody.includes("Referee One"), false);
  assert.equal(responseBody.includes("Referee Two"), false);

  const auditBody = JSON.stringify(ctx.auditEvents);
  assert.equal(auditBody.includes("displayName"), false);
  assert.equal(auditBody.includes("currentWorkload"), false);

  await ctx.app.close();
});
