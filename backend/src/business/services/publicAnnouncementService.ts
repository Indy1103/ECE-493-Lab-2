import type {
  ConferenceAnnouncement,
  ConferenceAnnouncementRepository
} from "../ports/conferenceAnnouncementRepository.js";

export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  publishStart: string;
  publishEnd: string | null;
}

export interface PublicAnnouncementsResult {
  state: "AVAILABLE" | "EMPTY";
  announcements: PublicAnnouncement[];
  message: string;
}

export class AnnouncementsUnavailableError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AnnouncementsUnavailableError";
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export class PublicAnnouncementService {
  constructor(private readonly repository: ConferenceAnnouncementRepository) {}

  async getPublicAnnouncements(now: Date = new Date()): Promise<PublicAnnouncementsResult> {
    try {
      const announcements = await this.repository.findEligibleAnnouncements(now);
      if (announcements.length === 0) {
        return {
          state: "EMPTY",
          announcements: [],
          message: "No conference announcements are currently available."
        };
      }

      return {
        state: "AVAILABLE",
        announcements: announcements.map(mapAnnouncement),
        message: "Announcements available."
      };
    } catch (error) {
      throw new AnnouncementsUnavailableError(
        "Conference announcements are temporarily unavailable.",
        error
      );
    }
  }
}

function mapAnnouncement(announcement: ConferenceAnnouncement): PublicAnnouncement {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    publishStart: announcement.publishStart.toISOString(),
    publishEnd:
      announcement.publishEnd === null ? null : announcement.publishEnd.toISOString()
  };
}
