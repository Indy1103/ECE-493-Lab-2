import test from "node:test";
import assert from "node:assert/strict";

import { createPasswordChangeTestApp } from "./password-change.testApp.js";

test("password change p95 latency is <= 500ms under normal load", async () => {
  const samples: number[] = [];

  for (let index = 0; index < 20; index += 1) {
    const ctx = await createPasswordChangeTestApp();
    const newPassword = `NewPassw0rd${index}9!A`;

    const started = Date.now();
    const response = await ctx.app.inject({
      method: "POST",
      url: "/api/v1/account/password-change",
      headers: {
        "x-forwarded-proto": "https",
        cookie: `cms_session=${ctx.sessionId}`
      },
      payload: {
        currentPassword: "Passw0rd88",
        newPassword,
        confirmNewPassword: newPassword
      }
    });
    samples.push(Date.now() - started);

    assert.equal(response.statusCode, 200);
    await ctx.app.close();
  }

  samples.sort((left, right) => left - right);
  const p95Index = Math.max(0, Math.ceil(samples.length * 0.95) - 1);
  const p95 = samples[p95Index] ?? 0;

  assert.equal(p95 <= 500, true);
});
