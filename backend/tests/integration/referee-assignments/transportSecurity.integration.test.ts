import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: assignment endpoints enforce TLS-only transport", async () => {
  const ctx = await createRefereeAssignmentTestApp();

  const getResponse = await request(ctx.app.server)
    .get(`/api/v1/papers/${ctx.paperId}/referee-assignment-options`)
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(getResponse.status, 426);
  assert.equal(getResponse.body.code, "TLS_REQUIRED");

  const postResponse = await request(ctx.app.server)
    .post(`/api/v1/papers/${ctx.paperId}/referee-assignments`)
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({ refereeIds: [ctx.refereeIds.r1] });

  assert.equal(postResponse.status, 426);
  assert.equal(postResponse.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
