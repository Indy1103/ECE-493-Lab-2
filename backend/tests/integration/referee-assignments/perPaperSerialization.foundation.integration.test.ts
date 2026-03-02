import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("foundation: same-paper assignment requests are serialized", async () => {
  const ctx = await createRefereeAssignmentTestApp({ maxRefereesPerPaper: 3 });

  const [first, second] = await Promise.all([
    request(ctx.app.server)
      .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({ refereeIds: [ctx.refereeIds.r1] }),
    request(ctx.app.server)
      .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({ refereeIds: [ctx.refereeIds.r2] })
  ]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(ctx.repository.getAllAssignments().length, 2);
  assert.equal(ctx.repository.getMaxObservedPaperConcurrency(ctx.paperId), 1);

  await ctx.app.close();
});
