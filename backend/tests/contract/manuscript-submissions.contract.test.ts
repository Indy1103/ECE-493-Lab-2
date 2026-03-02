import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import {
  ManuscriptErrorResponseSchema,
  ManuscriptSuccessResponseSchema,
  ManuscriptValidationErrorResponseSchema
} from "../../src/business/validation/manuscript-submission.schema.js";
import { createManuscriptSubmissionTestApp } from "../integration/manuscript-submissions.testApp.js";

function validPayload() {
  return {
    metadata: {
      title: "Paper-Driven Reviews",
      abstract: "A deterministic review assignment approach.",
      keywords: ["review", "workflow"],
      fullAuthorList: [{ name: "Jane Author" }],
      correspondingAuthorEmail: "jane.author@example.com",
      primarySubjectArea: "Software Engineering"
    },
    manuscriptFile: {
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 124_000,
      sha256Digest: "b".repeat(64),
      contentBase64: "JVBERi0xLjQ="
    }
  };
}

test("contract: requirements endpoint returns 200 payload", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .get("/api/v1/manuscript-submissions/requirements")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`);

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.cycleId, "string");
  assert.equal(response.body.intakeStatus, "OPEN");
  assert.deepEqual(response.body.requiredMetadataFields, [
    "title",
    "abstract",
    "keywords",
    "fullAuthorList",
    "correspondingAuthorEmail",
    "primarySubjectArea"
  ]);
  assert.equal(response.body.fileConstraints.maxBytes, 20 * 1024 * 1024);

  await ctx.app.close();
});

test("contract: submission success returns 201 payload", async () => {
  const ctx = await createManuscriptSubmissionTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 201);
  assert.equal(ManuscriptSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: metadata validation returns 400 with violations", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const payload = validPayload();
  payload.metadata.correspondingAuthorEmail = "invalid-email";
  payload.metadata.keywords = [];

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(response.status, 400);
  assert.equal(ManuscriptValidationErrorResponseSchema.safeParse(response.body).success, true);
  assert.equal(Array.isArray(response.body.violations), true);
  assert.equal(response.body.violations.length > 0, true);

  await ctx.app.close();
});

test("contract: intake closed returns 409 guidance payload", async () => {
  const ctx = await createManuscriptSubmissionTestApp({ intakeStatus: "CLOSED" });

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(validPayload());

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "INTAKE_CLOSED");
  assert.equal(ManuscriptErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: 413 returned for oversized manuscript", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const payload = validPayload();
  payload.manuscriptFile.byteSize = 20 * 1024 * 1024 + 1;

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(response.status, 413);
  assert.equal(response.body.code, "FILE_TOO_LARGE");
  assert.equal(ManuscriptErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: 415 returned for unsupported manuscript type", async () => {
  const ctx = await createManuscriptSubmissionTestApp();
  const payload = validPayload();
  payload.manuscriptFile.mediaType = "text/plain";

  const response = await request(ctx.app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send(payload);

  assert.equal(response.status, 415);
  assert.equal(response.body.code, "FILE_TYPE_NOT_ALLOWED");
  assert.equal(ManuscriptErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
