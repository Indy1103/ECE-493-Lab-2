import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createRegistrationPricesTestApp } from "./registration-prices/testRegistrationPricesApp.js";

test("logging test keeps registration-price failures explicit and plaintext-safe", async () => {
  const ctx = await createRegistrationPricesTestApp({
    forceRepositoryFailure: true
  });

  const response = await request(ctx.app.server)
    .get("/public/registration-prices")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "REGISTRATION_PRICES_RETRIEVAL_FAILED");

  assert.equal(ctx.loggerEvents.length, 1);
  const serialized = JSON.stringify(ctx.loggerEvents[0]);
  assert.equal(serialized.includes("password"), false);
  assert.equal(serialized.includes("paper"), false);

  await ctx.app.close();
});
