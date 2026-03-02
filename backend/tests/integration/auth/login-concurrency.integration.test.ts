import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("concurrent successful logins are processed safely", async () => {
  const ctx = await createLoginTestApp();

  const [first, second] = await Promise.all([
    request(ctx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .send({ username: "editor.jane", password: "Passw0rd88" }),
    request(ctx.app.server)
      .post("/api/public/login")
      .set("x-forwarded-proto", "https")
      .send({ username: "editor.jane", password: "Passw0rd88" })
  ]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(ctx.repository.getSessions().length, 2);

  await ctx.app.close();
});
