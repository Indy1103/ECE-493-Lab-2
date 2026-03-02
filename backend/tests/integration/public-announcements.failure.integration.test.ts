import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PublicAnnouncementService } from "../../src/business/services/publicAnnouncementService.js";
import { buildServer } from "../../src/presentation/http/server.js";

test("returns ANNOUNCEMENTS_UNAVAILABLE error payload when retrieval fails", async () => {
  const service = new PublicAnnouncementService({
    findEligibleAnnouncements: async () => {
      throw new Error("temporary backend outage");
    }
  });

  const app = buildServer({ service });
  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 503);
  assert.equal(response.body.code, "ANNOUNCEMENTS_UNAVAILABLE");
  assert.equal(
    response.body.message,
    "Conference announcements are temporarily unavailable. Please try again."
  );
  assert.ok(response.body.requestId);

  await app.close();
});
