import type { ConferenceAnnouncement } from "../ports/conferenceAnnouncementRepository.js";

export function isAnnouncementEligible(
  announcement: ConferenceAnnouncement,
  now: Date
): boolean {
  if (!announcement.isPublic) {
    return false;
  }

  if (announcement.publishStart.getTime() > now.getTime()) {
    return false;
  }

  if (
    announcement.publishEnd !== null &&
    now.getTime() > announcement.publishEnd.getTime()
  ) {
    return false;
  }

  return true;
}
