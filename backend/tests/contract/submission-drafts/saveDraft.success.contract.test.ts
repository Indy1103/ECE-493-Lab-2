import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  SaveDraftSuccessResponseSchema
} from "../../../src/presentation/submission-drafts/submissionDraftErrorMapper.js";
import { createSubmissionDraftTestApp } from "../../integration/submission-drafts/testSubmissionDraftApp.js";

test("contract: save draft success returns 200 payload", async () => {
  const ctx = await createSubmissionDraftTestApp();

  const response = await request(ctx.app.server)
    .put(`/api/v1/submission-drafts/${ctx.submissionId}`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      title: "Contract Draft",
      draftPayload: {
        abstract: "contract"
      }
    });

  assert.equal(response.status, 200);
  assert.equal(SaveDraftSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
