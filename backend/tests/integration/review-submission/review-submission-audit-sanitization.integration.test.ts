import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewSubmissionTestApp } from "./testReviewSubmissionApp.js";

test("polish: audit events redact review payload content", async () => {
  const ctx = await createReviewSubmissionTestApp();

  await request(ctx.app.server)
    .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `session=${ctx.sessionId}`)
    .send({
      responses: {
        summary: "sensitive review summary",
        overallScore: 1
      }
    });

  const events = ctx.auditRepository.list();
  assert.equal(events.length > 0, true);

  const validationEvent = events.find((event) => event.outcome === "validation-failed");
  if (validationEvent) {
    assert.equal(validationEvent.metadata.responses, "[REDACTED]");
    assert.equal(JSON.stringify(validationEvent).includes("sensitive review summary"), false);
  }

  await ctx.app.close();
});
