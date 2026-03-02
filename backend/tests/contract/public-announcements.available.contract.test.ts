import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";
import { PublicAnnouncementsResponseSchema } from "../../src/shared/contracts/publicAnnouncementsSchemas.js";

test("200 AVAILABLE response matches contract schema", async () => {
  const app = buildServer({
    service: {
      getPublicAnnouncements: async () => ({
        state: "AVAILABLE",
        announcements: [
          {
            id: "233a6b26-a22a-4c89-a5ec-2ef31a6b6f17",
            title: "Submission Deadline Extended",
            content: "The submission deadline is extended by one week.",
            publishStart: "2026-02-01T00:00:00.000Z",
            publishEnd: "2026-02-15T23:59:59.000Z"
          }
        ],
        message: "Announcements available."
      })
    }
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  const parsed = PublicAnnouncementsResponseSchema.safeParse(response.body);
  assert.equal(parsed.success, true);
  assert.equal(response.body.state, "AVAILABLE");

  await app.close();
});
