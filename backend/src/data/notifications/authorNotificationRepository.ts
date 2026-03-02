import { randomUUID } from "node:crypto";

export interface AuthorNotificationRecord {
  id: string;
  authorId: string;
  scheduleId: string;
  status: "SENT" | "FAILED";
  notifiedAt: Date;
}

interface AuthorNotificationRepositoryOptions {
  forceWriteFailure?: boolean;
}

export class AuthorNotificationRepository {
  private readonly notifications = new Map<string, AuthorNotificationRecord>();
  private readonly forceWriteFailure: boolean;

  constructor(options: AuthorNotificationRepositoryOptions = {}) {
    this.forceWriteFailure = options.forceWriteFailure ?? false;
  }

  async recordSent(input: {
    authorId: string;
    scheduleId: string;
  }): Promise<AuthorNotificationRecord> {
    if (this.forceWriteFailure) {
      throw new Error("AUTHOR_NOTIFICATION_WRITE_FAILED");
    }

    const key = `${input.authorId}:${input.scheduleId}`;
    const existing = this.notifications.get(key);
    if (existing) {
      return {
        ...existing,
        notifiedAt: new Date(existing.notifiedAt)
      };
    }

    const record: AuthorNotificationRecord = {
      id: randomUUID(),
      authorId: input.authorId,
      scheduleId: input.scheduleId,
      status: "SENT",
      notifiedAt: new Date()
    };

    this.notifications.set(key, { ...record, notifiedAt: new Date(record.notifiedAt) });

    return {
      ...record,
      notifiedAt: new Date(record.notifiedAt)
    };
  }

  list(): AuthorNotificationRecord[] {
    return Array.from(this.notifications.values()).map((record) => ({
      ...record,
      notifiedAt: new Date(record.notifiedAt)
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}
