import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";

test("rejects non-TLS public announcements requests", async () => {
  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => ({
        state: "AVAILABLE",
        announcements: [],
        message: "Announcements available."
      })
    }
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "http");

  assert.equal(response.status, 426);
  assert.equal(response.body.code, "TLS_REQUIRED");
  assert.equal(response.body.message, "HTTPS is required for public announcements.");
  assert.ok(response.body.requestId);

  await app.close();
});

test("can bypass TLS enforcement when explicitly disabled", async () => {
  const app = buildServer({
    requireTls: false,
    service: {
      getPublicAnnouncements: async () => ({
        state: "EMPTY",
        announcements: [],
        message: "No conference announcements are currently available."
      })
    }
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "http");

  assert.equal(response.status, 200);
  assert.equal(response.body.state, "EMPTY");

  await app.close();
});
