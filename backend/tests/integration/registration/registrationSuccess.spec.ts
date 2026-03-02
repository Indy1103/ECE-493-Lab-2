import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "./testRegistrationApp.js";

test("successful registration creates account and indicates login readiness", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      password: "Passw0rd88"
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.state, "REGISTERED");
  assert.equal(response.body.message, "Account created successfully. You can now log in.");

  const stored = await ctx.userRepository.findByNormalizedEmail("alex.johnson@example.com");
  assert.ok(stored);
  assert.equal(stored?.role, "REGISTERED_USER");
  assert.equal(stored?.status, "ACTIVE");

  await ctx.app.close();
});
