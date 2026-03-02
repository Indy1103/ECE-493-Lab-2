import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("concurrency: deterministic last-write-wins for valid near-simultaneous saves", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const firstPromise = request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Older Save",
      draftPayload: {
        abstract: "older"
      }
    });

  await new Promise((resolve) => setTimeout(resolve, 10));

  const secondPromise = request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Latest Save",
      draftPayload: {
        abstract: "latest"
      }
    });

  const [first, second] = await Promise.all([firstPromise, secondPromise]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  const drafts = ctx.repository.getCurrentDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, "Latest Save");
  assert.equal(drafts[0]?.draftPayload.abstract, "latest");

  await ctx.app.close();
});

test("concurrency: explicit concurrent-resolution response maps to 409", async () => {
  const ctx = await createSubmissionDraftTestApp({
    forceConcurrentResolutionFailure: true
  });

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Concurrent Draft",
      draftPayload: {
        abstract: "race"
      }
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "CONCURRENT_SAVE_RESOLVED");
  assert.equal(ctx.repository.getCurrentDrafts().length, 0);

  await ctx.app.close();
});
