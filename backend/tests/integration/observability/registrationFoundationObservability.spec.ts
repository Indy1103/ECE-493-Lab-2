import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationTestApp } from "../registration/testRegistrationApp.js";

test("registration responses and telemetry include request identifier and outcome", async () => {
  const ctx = await createRegistrationTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/registrations")
    .set("x-forwarded-proto", "https")
    .send({
      fullName: "Alex Johnson",
      email: "alex.obs@example.com",
      password: "Passw0rd88"
    });

  assert.equal(response.status, 201);
  assert.equal(response.headers["x-request-id"], "req_test_request_id");

  assert.equal(ctx.telemetryEvents.length > 0, true);
  assert.equal(ctx.telemetryEvents[0].requestId, "req_test_request_id");
  assert.equal(ctx.telemetryEvents[0].outcome, "REGISTERED");

  await ctx.app.close();
});
