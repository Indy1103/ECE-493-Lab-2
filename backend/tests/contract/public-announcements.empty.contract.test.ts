import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { buildServer } from "../../src/presentation/http/server.js";
import { PublicAnnouncementsResponseSchema } from "../../src/shared/contracts/publicAnnouncementsSchemas.js";

test("200 EMPTY response matches contract schema", async () => {
  const app = buildServer({
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
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  const parsed = PublicAnnouncementsResponseSchema.safeParse(response.body);
  assert.equal(parsed.success, true);
  assert.equal(response.body.state, "EMPTY");

  await app.close();
});
