import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("foundation: audit/event payloads avoid sensitive referee fields", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.ineligible] });

  assert.equal(response.status, 400);

  const serializedAudit = JSON.stringify(ctx.auditEvents);
  assert.equal(serializedAudit.includes("Referee One"), false);
  assert.equal(serializedAudit.includes("currentWorkload"), false);
  assert.equal(serializedAudit.includes("displayName"), false);

  await ctx.app.close();
});
