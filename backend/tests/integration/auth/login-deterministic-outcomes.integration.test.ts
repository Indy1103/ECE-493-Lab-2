import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("maps valid, invalid, throttled, and unavailable outcomes deterministically", async () => {
  const successCtx = await createLoginTestApp();
  const success = await request(successCtx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });
  assert.equal(success.status, 200);
  await successCtx.app.close();

  const invalidCtx = await createLoginTestApp();
  const invalid = await request(invalidCtx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "wrong" });
  assert.equal(invalid.status, 401);
  await invalidCtx.app.close();

  const throttledCtx = await createLoginTestApp();
  for (let index = 0; index < 5; index += 1) {
    await request(throttledCtx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .set("user-agent", "deterministic-agent")
      .send({ username: "editor.jane", password: "wrong" });
  }
  const throttled = await request(throttledCtx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .set("user-agent", "deterministic-agent")
    .send({ username: "editor.jane", password: "wrong" });
  assert.equal(throttled.status, 429);
  await throttledCtx.app.close();

  const unavailableCtx = await createLoginTestApp({ forceProcessingFailure: true });
  const unavailable = await request(unavailableCtx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });
  assert.equal(unavailable.status, 503);
  await unavailableCtx.app.close();
});
