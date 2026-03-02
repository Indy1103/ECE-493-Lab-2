import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("password plaintext is never persisted in attempts, sessions, or telemetry", async () => {
  const ctx = await createLoginTestApp();

  await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  const storedState = JSON.stringify({
    attempts: ctx.repository.getAttempts(),
    sessions: ctx.repository.getSessions(),
    telemetry: ctx.telemetryEvents
  });

  assert.equal(storedState.includes("Passw0rd88"), false);

  await ctx.app.close();
});
