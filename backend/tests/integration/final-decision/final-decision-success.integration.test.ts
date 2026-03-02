import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createFinalDecisionTestApp } from "./testFinalDecisionApp.js";

test("US1: eligible editor records final decision and author is notified", async () => {
  const ctx = await createFinalDecisionTestApp();

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "ACCEPT" });

  assert.equal(response.status, 200);
  assert.equal(response.body.outcome, "DECISION_RECORDED");
  assert.equal(response.body.decision, "ACCEPT");
  assert.equal(response.body.notificationStatus, "NOTIFIED");

  const decision = await ctx.repository.getFinalDecision(ctx.paperIds.complete);
  assert.equal(decision?.decision, "ACCEPT");

  const notifications = ctx.authorNotifier.getDispatches();
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.paperId, ctx.paperIds.complete);

  const events = ctx.auditRepository.list();
  assert.equal(events.some((event) => event.outcome === "DECISION_RECORDED"), true);

  await ctx.app.close();
});

test("US1: notification failure is visible while decision remains persisted", async () => {
  const ctx = await createFinalDecisionTestApp({ forceNotificationFailure: true });

  const response = await request(ctx.app.server)
    .post(`/api/editor/papers/${ctx.paperIds.complete}/decision`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.editorSessionId}`)
    .send({ decision: "REJECT" });

  assert.equal(response.status, 200);
  assert.equal(response.body.outcome, "DECISION_RECORDED");
  assert.equal(response.body.notificationStatus, "NOTIFICATION_FAILED");
  assert.equal(
    response.body.message,
    "Decision recorded. Author notification failed and must be retried."
  );

  const decision = await ctx.repository.getFinalDecision(ctx.paperIds.complete);
  assert.equal(decision?.decision, "REJECT");

  await ctx.app.close();
});
