import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("US2: retry after workload rejection succeeds with alternate eligible referee", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const first = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.atLimit] });

  assert.equal(first.status, 400);

  const second = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1] });

  assert.equal(second.status, 200);
  assert.equal(ctx.repository.getAllAssignments().length, 1);

  await ctx.app.close();
});
