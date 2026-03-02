import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("US3: concurrent requests preserve per-paper capacity integrity", async () => {
  const ctx = await createRefereeAssignmentTestApp({ maxRefereesPerPaper: 1 });

  const [a, b] = await Promise.all([
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

  const statuses = [a.status, b.status].sort((x, y) => x - y);
  assert.deepEqual(statuses, [200, 400]);
  assert.equal(ctx.repository.getAllAssignments().length, 1);
  assert.equal(ctx.repository.getMaxObservedPaperConcurrency(ctx.paperId), 1);

  await ctx.app.close();
});
