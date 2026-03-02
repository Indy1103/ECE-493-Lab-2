import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createManuscriptSubmissionTestApp } from "./manuscript-submissions.testApp.js";

function validPayload() {
  return {
    metadata: {
      title: "Practical Program Committee Scaling",
      abstract: "A reproducible approach to improve review throughput.",
      keywords: ["systems", "peer-review"],
      fullAuthorList: [{ name: "Jane Author" }],
      correspondingAuthorEmail: "jane.author@example.com",
      primarySubjectArea: "Software Engineering"
    },
    manuscriptFile: {
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 128_000,
      sha256Digest: "a".repeat(64),
      contentBase64: "JVBERi0xLjQ="
    }
  };
}

test("foundational: unauthenticated or expired session is rejected", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const unauthenticated = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .send(validPayload());
  assert.equal(unauthenticated.status, 401);

  await ctx.sessionRepository.expireSession(ctx.sessionId);

  const expired = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());
  assert.equal(expired.status, 401);

  await ctx.app.close();
});

test("foundational: intake-open and intake-closed gating behavior", async () => {
  const openCtx = await createManuscriptSubmissionTestApp();

  const openReq = await request(openCtx.app.server)
    .get("/api/v1/manuscript-submissions/requirements")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${openCtx.sessionId}`);
  assert.equal(openReq.status, 200);
  assert.equal(openReq.body.intakeStatus, "OPEN");

  await openCtx.app.close();

  const closedCtx = await createManuscriptSubmissionTestApp({ intakeStatus: "CLOSED" });

  const closedReq = await request(closedCtx.app.server)
    .get("/api/v1/manuscript-submissions/requirements")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${closedCtx.sessionId}`);
  assert.equal(closedReq.status, 409);
  assert.equal(closedReq.body.code, "INTAKE_CLOSED");

  await closedCtx.app.close();
});

test("foundational: deterministic duplicate check returns single winner", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const run = () =>
    request(ctx.app.server)
      .post("/api/v1/manuscript-submissions")
      .set("x-forwarded-proto", "https")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send(validPayload());

  const [first, second] = await Promise.all([run(), run()]);
  const statuses = [first.status, second.status].sort((left, right) => left - right);

  assert.deepEqual(statuses, [201, 409]);
  assert.equal(ctx.submissionRepository.getAll().length, 1);

  await ctx.app.close();
});

test("foundational: encrypted-storage reference and integrity metadata are persisted", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 201);

  const artifact = ctx.artifactRepository.getAll()[0];
  assert.equal(typeof artifact?.storageObjectKey, "string");
  assert.equal(artifact?.storageObjectKey.startsWith("encrypted://"), true);
  assert.equal(artifact?.mediaType, "application/pdf");
  assert.equal(artifact?.byteSize, 128_000);
  assert.equal(artifact?.sha256Digest, "a".repeat(64));

  await ctx.app.close();
});

test("atomic persistence: success writes submission, metadata, artifact, and audit rows", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 201);

  const submissionRows = ctx.submissionRepository.getAll();
  assert.equal(submissionRows.length, 1);
  const submission = submissionRows[0]!;
  assert.equal(submission.status, "SUBMITTED");

  const metadata = ctx.submissionRepository.getMetadataBySubmissionId(submission.id);
  assert.equal(metadata?.title, "Practical Program Committee Scaling");
  assert.equal(metadata?.keywords.length, 2);

  const artifacts = ctx.artifactRepository.getAll();
  assert.equal(artifacts.length, 1);
  assert.equal(artifacts[0]!.id, submission.manuscriptArtifactId);

  const audits = ctx.auditRepository.getAll();
  assert.equal(audits.length, 1);
  assert.equal(audits[0]!.outcome, "SUCCESS");

  await ctx.app.close();
});

test("successful submissions become downstream-available", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 201);
  assert.equal(ctx.submissionRepository.getAll()[0]?.downstreamAvailable, true);

  await ctx.app.close();
});

test("metadata validation failures return violations and no accepted submission is persisted", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const payload = validPayload();
  payload.metadata.primarySubjectArea = "";
  payload.metadata.correspondingAuthorEmail = "broken-email";

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");
  assert.equal(Array.isArray(response.body.violations), true);
  assert.equal(ctx.submissionRepository.getAll().length, 0);
  assert.equal(ctx.artifactRepository.getAll().length, 0);

  const audits = ctx.auditRepository.getAll();
  assert.equal(audits.length, 1);
  assert.equal(audits[0]!.outcome, "METADATA_INVALID");

  await ctx.app.close();
});

test("file validation failure returns explicit status and keeps accepted-state empty", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const payload = validPayload();
  payload.manuscriptFile.mediaType = "text/plain";

  const invalidType = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(invalidType.status, 415);
  assert.equal(invalidType.body.code, "FILE_TYPE_NOT_ALLOWED");
  assert.equal(ctx.submissionRepository.getAll().length, 0);
  assert.equal(ctx.artifactRepository.getAll().length, 0);

  payload.manuscriptFile.mediaType = "application/pdf";
  payload.manuscriptFile.byteSize = 20 * 1024 * 1024 + 10;

  const tooLarge = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.body.code, "FILE_TOO_LARGE");
  assert.equal(ctx.submissionRepository.getAll().length, 0);
  assert.equal(ctx.artifactRepository.getAll().length, 0);

  const audits = ctx.auditRepository.getAll();
  assert.equal(audits.length, 2);
  assert.equal(audits[0]!.outcome, "FILE_INVALID");
  assert.equal(audits[1]!.outcome, "FILE_INVALID");

  await ctx.app.close();
});

test("operational failure rolls back state and returns retry-capable guidance", async () => {
  const ctx = await createManuscriptSubmissionTestApp({ forceStorageFailure: true });

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 500);
  assert.equal(response.body.code, "OPERATIONAL_FAILURE");
  assert.equal(ctx.submissionRepository.getAll().length, 0);
  assert.equal(ctx.artifactRepository.getAll().length, 0);
  assert.equal(ctx.auditRepository.getAll().length, 1);
  assert.equal(ctx.auditRepository.getAll()[0]!.outcome, "OPERATIONAL_FAILED");

  await ctx.app.close();
});

test("non-TLS submission attempts are rejected with 426", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");
  assert.equal(ctx.submissionRepository.getAll().length, 0);

  await ctx.app.close();
});

test("non-author sessions are rejected with explicit authorization failure", async () => {
  const ctx = await createManuscriptSubmissionTestApp({ sessionRole: "EDITOR" });

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 403);
  assert.equal(response.body.code, "AUTHORIZATION_FAILED");

  await ctx.app.close();
});
