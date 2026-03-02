import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { PrismaConferenceAnnouncementRepository } from "../../src/data/prismaConferenceAnnouncementRepository.js";
import { PublicAnnouncementService } from "../../src/business/services/publicAnnouncementService.js";
import { buildServer } from "../../src/presentation/http/server.js";

const now = new Date("2026-02-10T12:00:00.000Z");

test("visibility-window filtering excludes non-public, scheduled, and expired announcements", async () => {
  const repository = new PrismaConferenceAnnouncementRepository({
    conferenceAnnouncement: {
      findMany: async () => [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Eligible",
          content: "Visible announcement",
          isPublic: true,
          publishStart: new Date("2026-02-01T00:00:00.000Z"),
          publishEnd: new Date("2026-02-15T23:59:59.000Z")
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Hidden",
          content: "Not public",
          isPublic: false,
          publishStart: new Date("2026-02-01T00:00:00.000Z"),
          publishEnd: null
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          title: "Scheduled",
          content: "Future",
          isPublic: true,
          publishStart: new Date("2026-02-20T00:00:00.000Z"),
          publishEnd: null
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          title: "Expired",
          content: "Past",
          isPublic: true,
          publishStart: new Date("2026-01-01T00:00:00.000Z"),
          publishEnd: new Date("2026-02-01T00:00:00.000Z")
        }
      ]
    }
  });

  const service = new PublicAnnouncementService(repository);
  const app = buildServer({
    service,
    nowProvider: () => now
  });

  await app.ready();

  const response = await request(app.server)
    .get("/api/public/announcements")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 200);
  assert.equal(response.body.state, "AVAILABLE");
  assert.equal(response.body.announcements.length, 1);
  assert.equal(response.body.announcements[0].id, "11111111-1111-4111-8111-111111111111");

  await app.close();
});
