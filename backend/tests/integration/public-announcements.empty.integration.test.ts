import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PublicAnnouncementService } from "../../src/business/services/publicAnnouncementService.js";
import { buildServer } from "../../src/presentation/http/server.js";

test("returns EMPTY state when no eligible announcements exist", async () => {
  const service = new PublicAnnouncementService({
    findEligibleAnnouncements: async () => []
  });

  const app = buildServer({ service });
  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  assert.equal(response.body.state, "EMPTY");
  assert.deepEqual(response.body.announcements, []);
  assert.equal(
    response.body.message,
    "No conference announcements are currently available."
  );

  await app.close();
});
