import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("audit and error outputs never include plaintext draft payload values", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "",
      draftPayload: {
        abstract: "secret-manuscript-text",
        keywords: ["secret-keyword"]
      }
    });

  assert.equal(response.status, 400);

  const responseDump = JSON.stringify(response.body);
  const attemptsDump = JSON.stringify(ctx.repository.getSaveAttempts());
  const auditDump = JSON.stringify(ctx.auditEvents);

  assert.equal(responseDump.includes("secret-manuscript-text"), false);
  assert.equal(responseDump.includes("secret-keyword"), false);
  assert.equal(attemptsDump.includes("secret-manuscript-text"), false);
  assert.equal(auditDump.includes("secret-manuscript-text"), false);

  await ctx.app.close();
});
