import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("polish: unauthenticated and non-editor access are rejected on both endpoints", async () => {
  const unauth = await createRefereeAssignmentTestApp();

  const unauthOptions = await request(unauth.app.server)
    .get(`/api/v1/papers/${unauth.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https");

  const unauthAssign = await request(unauth.app.server)
    .post(`/api/v1/papers/${unauth.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .send({ refereeIds: [unauth.refereeIds.r1] });

  assert.equal(unauthOptions.status, 401);
  assert.equal(unauthAssign.status, 401);
  await unauth.app.close();

  const nonEditor = await createRefereeAssignmentTestApp({ sessionRole: "AUTHOR" });

  const forbiddenOptions = await request(nonEditor.app.server)
    .get(`/api/v1/papers/${nonEditor.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${nonEditor.sessionId}`);

  const forbiddenAssign = await request(nonEditor.app.server)
    .post(`/api/v1/papers/${nonEditor.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${nonEditor.sessionId}`)
    .send({ refereeIds: [nonEditor.refereeIds.r1] });

  assert.equal(forbiddenOptions.status, 403);
  assert.equal(forbiddenAssign.status, 403);

  await nonEditor.app.close();
});
