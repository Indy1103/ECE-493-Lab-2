import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { LoginSuccessResponseSchema } from "../../../src/business/auth/login.schemas.js";
import { createLoginTestApp } from "../../integration/auth/testLoginApp.js";

test("contract: 200 AUTHENTICATED payload is schema compliant", async () => {
  const ctx = await createLoginTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  assert.equal(response.status, 200);
  assert.equal(LoginSuccessResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
