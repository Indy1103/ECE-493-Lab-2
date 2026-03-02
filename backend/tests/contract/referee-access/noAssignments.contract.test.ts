import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { AssignmentListResponseSchema } from "../../../src/presentation/referee-access/refereeAccessErrorHandler.js";
import { createRefereeAccessTestApp } from "../../integration/referee-access/testRefereeAccessApp.js";

test("contract: GET /api/referee/assignments returns NO_ASSIGNMENTS payload when none available", async () => {
  const ctx = await createRefereeAccessTestApp({ seedAssignment: false });

  const response = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(AssignmentListResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.messageCode, "NO_ASSIGNMENTS");
  assert.deepEqual(response.body.items, []);

  await ctx.app.close();
});
