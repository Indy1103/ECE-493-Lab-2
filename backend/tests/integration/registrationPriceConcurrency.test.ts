import test from "node:test";
import assert from "node:assert/strict";

import {
  createPublishedPriceListFixture,
  createRegistrationPricesTestApp
} from "./registration-prices/testRegistrationPricesApp.js";

test("concurrency test for public registration price retrieval", async () => {
  const ctx = await createRegistrationPricesTestApp({
    publishedPriceList: createPublishedPriceListFixture()
  });

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      ctx.app.inject({
        method: "GET",
        url: "/public/registration-prices",
        headers: {
          "x-forwarded-proto": "https"
        }
      })
    )
  );

  assert.equal(responses.every((response) => response.statusCode === 200), true);
  assert.equal(
    responses.every(
      (response) =>
        JSON.parse(response.body).id ===
        "5f4a6f31-1fca-4b75-ae17-a8ef9dd999a1"
    ),
    true
  );

  await ctx.app.close();
});
