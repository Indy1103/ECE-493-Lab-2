import test from "node:test";
import assert from "node:assert/strict";

import { isAnnouncementEligible } from "../../src/business/rules/publicAnnouncementEligibility.js";

const now = new Date("2026-02-10T12:00:00.000Z");

function baseAnnouncement() {
  return {
    id: "233a6b26-a22a-4c89-a5ec-2ef31a6b6f17",
    title: "Submission Deadline Extended",
    content: "The submission deadline is extended by one week.",
    isPublic: true,
    publishStart: new Date("2026-02-01T00:00:00.000Z"),
    publishEnd: null
  };
}

test("returns true when announcement is public and within active window", () => {
  assert.equal(isAnnouncementEligible(baseAnnouncement(), now), true);
});

test("returns false when announcement is not public", () => {
  const announcement = { ...baseAnnouncement(), isPublic: false };
  assert.equal(isAnnouncementEligible(announcement, now), false);
});

test("returns false when publishStart is in the future", () => {
  const announcement = {
    ...baseAnnouncement(),
    publishStart: new Date("2026-02-11T00:00:00.000Z")
  };
  assert.equal(isAnnouncementEligible(announcement, now), false);
});

test("returns false when publishEnd is before current time", () => {
  const announcement = {
    ...baseAnnouncement(),
    publishEnd: new Date("2026-02-10T11:59:59.999Z")
  };
  assert.equal(isAnnouncementEligible(announcement, now), false);
});

test("returns true when current time equals publishEnd boundary", () => {
  const announcement = {
    ...baseAnnouncement(),
    publishEnd: new Date("2026-02-10T12:00:00.000Z")
  };
  assert.equal(isAnnouncementEligible(announcement, now), true);
});
