import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createPasswordChangeTestApp } from "../integration/password-change.testApp.js";

function hasViolationPayload(body: unknown): boolean {
  const parsed = body as Record<string, unknown>;
  return (
    typeof parsed.code === "string" &&
    typeof parsed.message === "string" &&
    Array.isArray(parsed.violations)
  );
}

test("contract: 200 password change success payload", async () => {
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
  assert.equal(response.body.reauthenticationRequired, true);
  assert.equal(typeof response.body.message, "string");

  await ctx.app.close();
});

test("contract: 400 validation payload", async () => {
  const ctx = await createPasswordChangeTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "",
      newPassword: "short",
      confirmNewPassword: "mismatch"
    });

  assert.equal(response.status, 400);
  assert.equal(hasViolationPayload(response.body), true);

  await ctx.app.close();
});

test("contract: 401 invalid session payload", async () => {
  const ctx = await createPasswordChangeTestApp();

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", "cms_session=bad_session")
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "SESSION_INVALID");

  await ctx.app.close();
});

test("contract: 429 throttled payload", async () => {
  const ctx = await createPasswordChangeTestApp();

  for (let index = 0; index < 5; index += 1) {
    await request(ctx.app.server)
      .post("/api/v1/account/password-change")
      .set("x-forwarded-proto", "https")
      .set("x-forwarded-for", "10.0.0.10")
      .set("cookie", `cms_session=${ctx.sessionId}`)
      .send({
        currentPassword: "WrongCurrent1!",
        newPassword: "NewPassw0rd99!",
        confirmNewPassword: "NewPassw0rd99!"
      });
  }

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("x-forwarded-for", "10.0.0.10")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "WrongCurrent1!",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 429);
  assert.equal(response.body.code, "PASSWORD_CHANGE_THROTTLED");
  assert.equal(Number(response.headers["retry-after"]) > 0, true);

  await ctx.app.close();
});

test("contract: 500 operational failure payload", async () => {
  const ctx = await createPasswordChangeTestApp({ forceAuditFailure: true });

  const response = await request(ctx.app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .set("cookie", `cms_session=${ctx.sessionId}`)
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 500);
  assert.equal(response.body.code, "PASSWORD_CHANGE_UNAVAILABLE");

  await ctx.app.close();
});

test("contract: 409 conflict payload", async () => {
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
