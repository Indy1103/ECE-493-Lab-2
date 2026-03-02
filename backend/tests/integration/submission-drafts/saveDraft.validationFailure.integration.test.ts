import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("validation failure keeps previously saved valid draft unchanged", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const valid = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Stable Valid Draft",
      draftPayload: {
        abstract: "safe"
      }
    });

  assert.equal(valid.status, 200);

  const invalid = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "",
      draftPayload: {
        correspondingAuthorEmail: "not-an-email"
      }
    });

  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.code, "VALIDATION_FAILED");

  const drafts = ctx.repository.getCurrentDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, "Stable Valid Draft");
  assert.equal(drafts[0]?.payloadVersion, 1);

  await ctx.app.close();
});
