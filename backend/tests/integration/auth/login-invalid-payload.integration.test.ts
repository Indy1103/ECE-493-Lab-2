import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("invalid payload shape is rejected with INVALID_CREDENTIALS and no plaintext capture", async () => {
  const ctx = await createLoginTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "", password: "" });

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "INVALID_CREDENTIALS");
  assert.equal(response.body.requestId, "req_login_test");

  const noBody = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https");

  assert.equal(noBody.status, 401);
  assert.equal(noBody.body.code, "INVALID_CREDENTIALS");

  const attempts = ctx.repository.getAttempts();
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0]?.usernameSubmitted, "");
  assert.equal(attempts[1]?.usernameSubmitted, "");

  await ctx.app.close();
});
