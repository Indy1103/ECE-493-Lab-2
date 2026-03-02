import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAccessTestApp } from "./testRefereeAccessApp.js";

test("US2: no assignments returns explicit NO_ASSIGNMENTS state and no paper access option", async () => {
  const ctx = await createRefereeAccessTestApp({ seedAssignment: false });

  const response = await request(ctx.app.server)
    .get("/api/referee/assignments")
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.messageCode, "NO_ASSIGNMENTS");
  assert.deepEqual(response.body.items, []);

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "NO_ASSIGNMENTS"), true);

  await ctx.app.close();
});
