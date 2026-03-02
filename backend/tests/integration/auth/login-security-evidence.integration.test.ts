import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("release evidence: transport rejection and no-plaintext findings", async () => {
  const ctx = await createLoginTestApp();

  const nonTls = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "http")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  assert.equal(nonTls.status, 426);

  await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  const captured = JSON.stringify({
    attempts: ctx.repository.getAttempts(),
    sessions: ctx.repository.getSessions(),
    telemetry: ctx.telemetryEvents
  });
  assert.equal(captured.includes("Passw0rd88"), false);

  await ctx.app.close();
});
