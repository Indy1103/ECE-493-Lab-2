export interface ConferenceAnnouncement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  publishStart: Date;
  publishEnd: Date | null;
}

export interface ConferenceAnnouncementRepository {
  findEligibleAnnouncements(now: Date): Promise<ConferenceAnnouncement[]>;
}
