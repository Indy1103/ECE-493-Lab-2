import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("rejects non-TLS login transport", async () => {
  const ctx = await createLoginTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "http")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");

  await ctx.app.close();
});
