import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("foundation: audit logging does not emit plaintext draft payload", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Sensitive Draft",
      draftPayload: {
        abstract: "Highly sensitive abstract content"
      }
    });

  assert.equal(response.status, 200);

  const attemptDump = JSON.stringify(ctx.repository.getSaveAttempts());
  const auditDump = JSON.stringify(ctx.auditEvents);

  assert.equal(attemptDump.includes("Highly sensitive abstract content"), false);
  assert.equal(auditDump.includes("Highly sensitive abstract content"), false);
  assert.equal(auditDump.includes("Sensitive Draft"), false);

  await ctx.app.close();
});
