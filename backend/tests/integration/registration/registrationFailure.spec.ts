import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "./testRegistrationApp.js";

test("operational failure returns explicit retry-capable 503 with requestId", async () => {
  const ctx = await createRegistrationTestApp({ forceProcessingFailure: true });

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "alex.johnson@example.com",
      password: "Passw0rd88"
    });

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "REGISTRATION_UNAVAILABLE");
  assert.equal(response.body.requestId, "req_test_request_id");

  await ctx.app.close();
});
