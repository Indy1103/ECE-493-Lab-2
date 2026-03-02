import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "../registration/testRegistrationApp.js";

test("registration route rejects non-TLS transport", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "http")
    .send({
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      password: "Passw0rd88"
    });

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});

test("plaintext password is never persisted or emitted in telemetry", async () => {
  const ctx = await createRegistrationTestApp();

  await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      password: "Passw0rd88"
    });

  const account = await ctx.userRepository.findByNormalizedEmail("alex.johnson@example.com");
  assert.ok(account);
  assert.notEqual(account?.passwordHash, "Passw0rd88");

  const telemetryText = JSON.stringify(ctx.telemetryEvents);
  assert.equal(telemetryText.includes("Passw0rd88"), false);

  await ctx.app.close();
});
