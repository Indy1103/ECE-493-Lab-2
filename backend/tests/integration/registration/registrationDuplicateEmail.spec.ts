import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "./testRegistrationApp.js";

test("duplicate email detection uses trim + lowercase normalization", async () => {
  const ctx = await createRegistrationTestApp();

  await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      password: "Passw0rd88"
    });

  const duplicateResponse = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "  ALEX.JOHNSON@example.com ",
      password: "Passw0rd88"
    });

  assert.equal(duplicateResponse.status, 409);
  assert.equal(duplicateResponse.body.code, "EMAIL_ALREADY_REGISTERED");

  await ctx.app.close();
});
