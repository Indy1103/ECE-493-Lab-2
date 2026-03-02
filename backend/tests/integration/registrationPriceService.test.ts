import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import {
  createPublishedPriceListFixture,
  createRegistrationPricesTestApp
} from "./registration-prices/testRegistrationPricesApp.js";

test("published list retrieval returns attendee price options", async () => {
  const ctx = await createRegistrationPricesTestApp({
    publishedPriceList: createPublishedPriceListFixture()
  });

  const response = await request(ctx.app.server)
    .get("/public/registration-prices")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "PUBLISHED");
  assert.equal(response.body.prices.length, 2);
  assert.equal(response.body.prices[0].attendanceType, "student");
  assert.equal(response.body.prices[1].attendanceType, "regular");

  await ctx.app.close();
});

test("unavailable list path returns explicit attendee message", async () => {
  const ctx = await createRegistrationPricesTestApp();

  const response = await request(ctx.app.server)
    .get("/public/registration-prices")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 404);
  assert.equal(response.body.code, "REGISTRATION_PRICES_UNAVAILABLE");
  assert.equal(
    response.body.message,
    "Registration prices are currently unavailable."
  );

  await ctx.app.close();
});
