import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import {
  RegistrationSuccessResponseSchema,
  ValidationErrorResponseSchema,
  DuplicateEmailResponseSchema,
  RegistrationThrottledResponseSchema,
  RegistrationUnavailableResponseSchema
} from "../../src/presentation/registration/registrationSchemas.js";
import { createRegistrationTestApp } from "../integration/registration/testRegistrationApp.js";

const validPayload = {
  fullName: "Alex Johnson",
  email: "alex.johnson@example.com",
  password: "Passw0rd88"
};

test("contract: returns 201 REGISTERED payload", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send(validPayload);

  assert.equal(response.status, 201);
  assert.equal(RegistrationSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: returns 400 VALIDATION_FAILED payload", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({ fullName: "", email: "bad", password: "short" });

  assert.equal(response.status, 400);
  assert.equal(ValidationErrorResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: returns 409 EMAIL_ALREADY_REGISTERED payload", async () => {
  const ctx = await createRegistrationTestApp();

  await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send(validPayload);

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({ ...validPayload, email: "  ALEX.JOHNSON@example.com " });

  assert.equal(response.status, 409);
  assert.equal(DuplicateEmailResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: returns 429 REGISTRATION_THROTTLED payload", async () => {
  const ctx = await createRegistrationTestApp();

  for (let index = 0; index < 5; index += 1) {
    await request(ctx.app.server)
      .post("/api/public/registrations")
      .set("x-forwarded-proto", "https")
      .set("user-agent", "throttle-agent")
      .send({ fullName: "", email: "bad", password: "short" });
  }

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .set("user-agent", "throttle-agent")
    .send({ fullName: "", email: "bad", password: "short" });

  assert.equal(response.status, 429);
  assert.equal(RegistrationThrottledResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: returns 503 REGISTRATION_UNAVAILABLE payload", async () => {
  const ctx = await createRegistrationTestApp({ forceProcessingFailure: true });

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send(validPayload);

  assert.equal(response.status, 503);
  assert.equal(RegistrationUnavailableResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
