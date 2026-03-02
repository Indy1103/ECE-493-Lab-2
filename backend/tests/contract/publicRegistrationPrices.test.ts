import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PublishedRegistrationPriceListSchema } from "../../src/business/validation/registrationPriceValidation.js";
import { RegistrationPricesUnavailableResponseSchema } from "../../src/presentation/http/errorResponses.js";
import {
  createPublishedPriceListFixture,
  createRegistrationPricesTestApp
} from "../integration/registration-prices/testRegistrationPricesApp.js";

test("contract: GET /public/registration-prices returns 200 payload", async () => {
  const ctx = await createRegistrationPricesTestApp({
    publishedPriceList: createPublishedPriceListFixture()
  });

  const response = await request(ctx.app.server)
    .get("/public/registration-prices")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  assert.equal(PublishedRegistrationPriceListSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});

test("contract: GET /public/registration-prices returns 404 when unavailable", async () => {
  const ctx = await createRegistrationPricesTestApp();

  const response = await request(ctx.app.server)
    .get("/public/registration-prices")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 404);
  assert.equal(
    RegistrationPricesUnavailableResponseSchema.safeParse(response.body).success,
    true
  );

  await ctx.app.close();
});
