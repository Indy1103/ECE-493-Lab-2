import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("failed login threshold triggers throttle window with retry guidance", async () => {
  const ctx = await createLoginTestApp();

  for (let index = 0; index < 5; index += 1) {
    const invalid = await request(ctx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .set("user-agent", "window-agent")
      .send({ username: "editor.jane", password: "wrong" });

    assert.equal(invalid.status, 401);
  }

  const throttled = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .set("user-agent", "window-agent")
    .send({ username: "editor.jane", password: "wrong" });

  assert.equal(throttled.status, 429);
  assert.equal(throttled.body.retryAfterSeconds > 0, true);

  await ctx.app.close();
});
