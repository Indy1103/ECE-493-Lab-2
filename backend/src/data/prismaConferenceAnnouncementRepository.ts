import type { ConferenceAnnouncementRepository } from "../business/ports/conferenceAnnouncementRepository.js";
import { isAnnouncementEligible } from "../business/rules/publicAnnouncementEligibility.js";

interface ConferenceAnnouncementRecord {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  publishStart: Date;
  publishEnd: Date | null;
}

interface PrismaClientLike {
  conferenceAnnouncement: {
    findMany(args: {
      where: {
        isPublic: boolean;
        publishStart: { lte: Date };
        OR: Array<{ publishEnd: null } | { publishEnd: { gte: Date } }>;
      };
      orderBy: { publishStart: "desc" };
    }): Promise<ConferenceAnnouncementRecord[]>;
  };
}

export class PrismaConferenceAnnouncementRepository
  implements ConferenceAnnouncementRepository
{
  constructor(private readonly prisma: PrismaClientLike) {}

  async findEligibleAnnouncements(now: Date): Promise<ConferenceAnnouncementRecord[]> {
    const records = await this.prisma.conferenceAnnouncement.findMany({
      where: {
        isPublic: true,
        publishStart: { lte: now },
        OR: [{ publishEnd: null }, { publishEnd: { gte: now } }]
      },
      orderBy: { publishStart: "desc" }
    });

    return records.filter((record) => isAnnouncementEligible(record, now));
  }
}
