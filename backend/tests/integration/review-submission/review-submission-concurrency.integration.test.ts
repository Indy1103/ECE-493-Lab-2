import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createReviewSubmissionTestApp } from "./testReviewSubmissionApp.js";

test("polish: concurrent submission attempts preserve single final record", async () => {
  const ctx = await createReviewSubmissionTestApp();
  const baseUrl = await ctx.app.listen({ port: 0, host: "127.0.0.1" });

  const attempts = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      request(baseUrl)
        .post(`/api/referee/assignments/${ctx.assignmentId}/review-submissions`)
        .set("x-forwarded-proto", "https")
        .set("cookie", `session=${ctx.sessionId}`)
        .send({
          responses: {
            summary: `Concurrent summary ${index}`,
            overallScore: 4
          }
        })
    )
  );

  const successCount = attempts.filter((result) => result.status === 201).length;
  const conflictCount = attempts.filter((result) => result.status === 409).length;

  assert.equal(successCount, 1);
  assert.equal(conflictCount, 5);
  assert.equal(ctx.submissionRepository.list().length, 1);

  await ctx.app.close();
});
