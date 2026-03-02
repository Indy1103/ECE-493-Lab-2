import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { AuthenticationUnavailableResponseSchema } from "../../../src/business/auth/login.schemas.js";
import { createLoginTestApp } from "../../integration/auth/testLoginApp.js";

test("contract: 503 AUTHENTICATION_UNAVAILABLE payload is schema compliant", async () => {
  const ctx = await createLoginTestApp({ forceProcessingFailure: true });

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  assert.equal(response.status, 503);
  assert.equal(AuthenticationUnavailableResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
