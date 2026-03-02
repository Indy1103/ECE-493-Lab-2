import assert from "node:assert/strict";
import test from "node:test";

import request from "supertest";

import { createRefereeAssignmentTestApp } from "./testRefereeAssignmentApp.js";

test("foundation: assignment endpoints reject unauthenticated and non-editor sessions", async () => {
  const unauthenticated = await createRefereeAssignmentTestApp();

  const unauthGet = await request(unauthenticated.app.server)
    .get(`/api/v1/papers/${unauthenticated.paperId}/referee-assignment-options`)
    .set("x-forwarded-proto", "https");

  assert.equal(unauthGet.status, 401);
  assert.equal(unauthGet.body.code, "AUTHENTICATION_REQUIRED");

  const unauthPost = await request(unauthenticated.app.server)
    .post(`/api/v1/papers/${unauthenticated.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .send({ refereeIds: [unauthenticated.refereeIds.r1] });

  assert.equal(unauthPost.status, 401);
  assert.equal(unauthPost.body.code, "AUTHENTICATION_REQUIRED");
  await unauthenticated.app.close();

  const nonEditor = await createRefereeAssignmentTestApp({ sessionRole: "AUTHOR" });

  const forbidden = await request(nonEditor.app.server)
    .post(`/api/v1/papers/${nonEditor.paperId}/referee-assignments`)
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${nonEditor.sessionId}`)
    .send({ refereeIds: [nonEditor.refereeIds.r1] });

  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.body.code, "AUTHORIZATION_FAILED");

  await nonEditor.app.close();
});
