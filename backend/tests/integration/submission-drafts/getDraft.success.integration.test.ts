import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("get draft returns latest saved draft for owning author", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const save = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Resume Later",
      draftPayload: {
        abstract: "resume me",
        keywords: ["resume"]
      }
    });

  assert.equal(save.status, 200);

  const get = await request(ctx.app.server)
    .get(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(get.status, 200);
  assert.equal(get.body.submissionId, ctx.submissionId);
  assert.equal(get.body.title, "Resume Later");
  assert.equal(get.body.draftPayload.abstract, "resume me");

  await ctx.app.close();
});
