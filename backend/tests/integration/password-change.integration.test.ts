import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import argon2 from "argon2";

import { createPasswordChangeTestApp } from "./password-change.testApp.js";

test("successful password change updates credentials, writes history, and revokes sessions", async () => {
  const ctx = await createPasswordChangeTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 200);
  assert.equal(ctx.credentialRepository.getHistoryByAccount(ctx.accountId).length, 1);
  assert.equal(ctx.sessionRepository.getActiveSessionsByAccount(ctx.accountId).length, 0);
  const currentState = await ctx.credentialRepository.getCredentialState(ctx.accountId);
  assert.equal(currentState !== null, true);
  assert.equal(await argon2.verify(currentState!.passwordHash, "Passw0rd88"), false);
  assert.equal(await argon2.verify(currentState!.passwordHash, "NewPassw0rd99!"), true);

  await ctx.app.close();
});

test("non-TLS password change requests are rejected", async () => {
  const ctx = await createPasswordChangeTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 426);

  await ctx.app.close();
});

test("invalid current password keeps previous credential state", async () => {
  const ctx = await createPasswordChangeTestApp();
  const before = await ctx.credentialRepository.getCredentialState(ctx.accountId);

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "WrongCurrent1!",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  const after = await ctx.credentialRepository.getCredentialState(ctx.accountId);
  assert.equal(response.status, 400);
  assert.deepEqual(after, before);

  await ctx.app.close();
});

test("invalid or expired session is rejected and credential state remains unchanged", async () => {
  const ctx = await createPasswordChangeTestApp();
  await ctx.sessionRepository.expireSession(ctx.sessionId);

  const before = await ctx.credentialRepository.getCredentialState(ctx.accountId);

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  const after = await ctx.credentialRepository.getCredentialState(ctx.accountId);

  assert.equal(response.status, 401);
  assert.deepEqual(after, before);

  await ctx.app.close();
});

test("failed attempts trigger temporary throttle with explicit retry guidance", async () => {
  const ctx = await createPasswordChangeTestApp();

  for (let index = 0; index < 5; index += 1) {
    const invalid = await request(ctx.app.server)
      .post("/api/v1/account/password-change")
      .set("x-forwarded-proto", "https")
      .set("x-forwarded-for", "10.0.0.11")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({
        currentPassword: "WrongCurrent1!",
        newPassword: "NewPassw0rd99!",
        confirmNewPassword: "NewPassw0rd99!"
      });

    assert.equal(invalid.status, 400);
  }

  const throttled = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("x-forwarded-for", "10.0.0.11")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "WrongCurrent1!",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(throttled.status, 429);
  assert.equal(Number(throttled.headers["retry-after"]) > 0, true);

  await ctx.app.close();
});

test("partial failure rolls back credential updates and returns operational failure", async () => {
  const ctx = await createPasswordChangeTestApp({ forceSessionRevokeFailure: true });

  const before = await ctx.credentialRepository.getCredentialState(ctx.accountId);

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  const after = await ctx.credentialRepository.getCredentialState(ctx.accountId);

  assert.equal(response.status, 500);
  assert.deepEqual(after, before);

  await ctx.app.close();
});

test("concurrent conflict maps to 409 response", async () => {
  const ctx = await createPasswordChangeTestApp({ forceConflict: true });

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.code, "CREDENTIAL_VERSION_CONFLICT");

  await ctx.app.close();
});
