import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  NotificationFailedResponseSchema,
  AuthorDecisionErrorResponseSchema
} from "../../../src/presentation/author-decision/error-mapper.js";
import { createAuthorDecisionTestApp } from "../../integration/author-decision/testAuthorDecisionApp.js";

test("contract: notification failed returns NOTIFICATION_FAILED payload", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.notificationFailed}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.authorSessionId}`);

  assert.equal(response.status, 409);
  assert.equal(NotificationFailedResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "NOTIFICATION_FAILED");

  await ctx.app.close();
});

test("contract: non-author access returns generic unavailable/denied", async () => {
  const ctx = await createAuthorDecisionTestApp();

  const response = await request(ctx.app.server)
    .get(`/api/author/papers/${ctx.paperIds.delivered}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.nonAuthorSessionId}`);

  assert.equal(response.status, 403);
  assert.equal(AuthorDecisionErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(response.body.outcome, "UNAVAILABLE_DENIED");

  await ctx.app.close();
});
