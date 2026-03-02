import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { ThrottledLoginResponseSchema } from "../../../src/business/auth/login.schemas.js";
import { createLoginTestApp } from "../../integration/auth/testLoginApp.js";

test("contract: 429 LOGIN_THROTTLED payload is schema compliant", async () => {
  const ctx = await createLoginTestApp();

  for (let index = 0; index < 5; index += 1) {
    await request(ctx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .set("user-agent", "contract-throttle")
      .send({ username: "editor.jane", password: "wrong" });
  }

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .set("user-agent", "contract-throttle")
    .send({ username: "editor.jane", password: "wrong" });

  assert.equal(response.status, 429);
  assert.equal(ThrottledLoginResponseSchema.safeParse(response.body).success, true);

  await ctx.app.close();
});
