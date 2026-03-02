import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createAuthorDecisionTestApp } from "./testAuthorDecisionApp.js";

test("US2: notification failure returns banner outcome and blocks decision access", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.notificationFailed}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(response.body.outcome, "NOTIFICATION_FAILED");

  const events = ctx.auditRepository.list();
  const latest = events[events.length - 1];
  assert.equal(latest?.outcome, "NOTIFICATION_FAILED");

  await ctx.app.close();
});

test("US2: no session returns SESSION_EXPIRED", async () => {
  const ctx = await createAuthorDecisionTestApp({ includeSession: false });

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 401);
  assert.equal(response.body.outcome, "SESSION_EXPIRED");

  await ctx.app.close();
});
