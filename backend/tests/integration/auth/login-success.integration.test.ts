import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createLoginTestApp } from "./testLoginApp.js";

test("successful login creates authenticated session and returns role home path", async () => {
  const ctx = await createLoginTestApp();

  const response = await request(ctx.app.server)
    .post("/api/public/login")
    .set("x-forwarded-proto", "https")
    .send({ username: "editor.jane", password: "Passw0rd88" });

  assert.equal(response.status, 200);
  assert.equal(response.body.state, "AUTHENTICATED");
  assert.equal(response.body.roleHomePath, "/editor/home");
  assert.equal(ctx.repository.getSessions().length, 1);

  await ctx.app.close();
});
