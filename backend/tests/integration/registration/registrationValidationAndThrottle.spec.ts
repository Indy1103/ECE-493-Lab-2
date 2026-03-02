import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "./testRegistrationApp.js";

test("invalid registration returns field-level validation feedback", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "   ",
      email: "invalid-email",
      password: "1234"
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");
  assert.equal(response.body.errors.length, 3);

  await ctx.app.close();
});

test("missing request fields are mapped to empty defaults and rejected", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_FAILED");

  await ctx.app.close();
});

test("client is throttled after 5 failed submissions within 10 minutes", async () => {
  const ctx = await createRegistrationTestApp();

  for (let index = 0; index < 5; index += 1) {
    const response = await request(ctx.app.server)
      .post("/api/public/registrations")
      .set("x-forwarded-proto", "https")
      .set("user-agent", "failed-attempt-agent")
      .send({
        fullName: "",
        email: "invalid",
        password: "bad"
      });

    assert.equal(response.status, 400);
  }

  const throttledResponse = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .set("user-agent", "failed-attempt-agent")
    .send({
      fullName: "",
      email: "invalid",
      password: "bad"
    });

  assert.equal(throttledResponse.status, 429);
  assert.equal(throttledResponse.body.code, "REGISTRATION_THROTTLED");
  assert.equal(throttledResponse.body.retryAfterSeconds > 0, true);

  await ctx.app.close();
});
