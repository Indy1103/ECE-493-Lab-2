import test from "node:test";
import assert from "node:assert/strict";

import {
  PublicAnnouncementService,
  AnnouncementsUnavailableError
} from "../../src/business/services/publicAnnouncementService.js";

const now = new Date("2026-02-10T12:00:00.000Z");

test("maps non-empty eligible announcements to AVAILABLE state", async () => {
  const service = new PublicAnnouncementService({
    findEligibleAnnouncements: async () => [
      {
        id: "233a6b26-a22a-4c89-a5ec-2ef31a6b6f17",
        title: "Submission Deadline Extended",
        content: "The submission deadline is extended by one week.",
        isPublic: true,
        publishStart: new Date("2026-02-01T00:00:00.000Z"),
        publishEnd: null
      }
    ]
  });

  const result = await service.getPublicAnnouncements(now);
  assert.equal(result.state, "AVAILABLE");
  assert.equal(result.announcements.length, 1);
  assert.equal(result.message, "Announcements available.");
});

test("maps empty eligible announcements to EMPTY state", async () => {
  const service = new PublicAnnouncementService({
    findEligibleAnnouncements: async () => []
  });

  const result = await service.getPublicAnnouncements(now);
  assert.equal(result.state, "EMPTY");
  assert.deepEqual(result.announcements, []);
  assert.equal(
    result.message,
    "No conference announcements are currently available."
  );
});

test("maps repository errors to AnnouncementsUnavailableError", async () => {
  const service = new PublicAnnouncementService({
    findEligibleAnnouncements: async () => {
      throw new Error("db unavailable");
    }
  });

  await assert.rejects(
    () => service.getPublicAnnouncements(now),
    AnnouncementsUnavailableError
  );
});
