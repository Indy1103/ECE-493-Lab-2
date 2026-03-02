import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "../registration/testRegistrationApp.js";

test("concurrent duplicate registration attempts create only one account", async () => {
  const ctx = await createRegistrationTestApp();

  const payload = {
    fullName: "Alex Johnson",
    email: "alex.concurrent@example.com",
    password: "Passw0rd88"
  };

  const [first, second] = await Promise.all([
    request(ctx.app.server)
      .post("/api/public/registrations")
      .set("x-forwarded-proto", "https")
      .send(payload),
    request(ctx.app.server)
      .post("/api/public/registrations")
      .set("x-forwarded-proto", "https")
      .send(payload)
  ]);

  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const account = await ctx.userRepository.findByNormalizedEmail("alex.concurrent@example.com");
  assert.ok(account);

  await ctx.app.close();
});
