import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createSubmissionDraftTestApp } from "./testSubmissionDraftApp.js";

test("save draft overwrite: repeated valid saves keep one current draft and latest payload", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const first = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Draft Version One",
      draftPayload: {
        abstract: "first"
      }
    });

  const second = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Draft Version Two",
      draftPayload: {
        abstract: "second",
        keywords: ["updated"]
      }
    });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  const drafts = ctx.repository.getCurrentDrafts();
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0]?.title, "Draft Version Two");
  assert.equal(drafts[0]?.payloadVersion, 2);

  const snapshots = ctx.repository.getSnapshots();
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[1]?.version, 2);

  await ctx.app.close();
});
