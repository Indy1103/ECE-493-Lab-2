import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createManuscriptSubmissionTestApp } from "./manuscript-submissions.testApp.js";

function buildPayload() {
  return {
    metadata: {
      title: "Deterministic Duplicate Race",
      abstract: "Concurrent duplicate protection validation.",
      keywords: ["concurrency"],
      fullAuthorList: [{ name: "Race Author" }],
      correspondingAuthorEmail: "race.author@example.com",
      primarySubjectArea: "Systems"
    },
    manuscriptFile: {
      filename: "race.pdf",
      mediaType: "application/pdf",
      byteSize: 60_000,
      sha256Digest: "c".repeat(64),
      contentBase64: "JVBERi0xLjQ="
    }
  };
}

test("concurrency: same-author duplicate submissions enforce deterministic single winner", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const tasks = Array.from({ length: 2 }, () =>
    request(ctx.app.server)
      .post("/api/v1/manuscript-submissions")
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send(buildPayload())
  );

  const responses = await Promise.all(tasks);
  const created = responses.filter((response) => response.status === 201);
  const duplicates = responses.filter((response) => response.status === 409);

  assert.equal(created.length, 1);
  assert.equal(duplicates.length, 1);
  assert.equal(ctx.submissionRepository.getAll().length, 1);
  assert.equal(
    duplicates.every((response) => response.body.code === "DUPLICATE_ACTIVE_SUBMISSION"),
    true
  );

  await ctx.app.close();
});
