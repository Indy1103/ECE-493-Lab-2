export interface SessionRecord {
  sessionId: string;
  accountId: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  revokedAt?: Date;
  revokeReason?: "PASSWORD_CHANGED";
}

export interface SessionRepository {
  getSessionById(sessionId: string): Promise<SessionRecord | null>;
  revokeAllByAccount(accountId: string, now: Date): Promise<void>;
  snapshot(): SessionRecord[];
  restore(snapshot: SessionRecord[]): void;
}

interface InMemorySessionRepositoryOptions {
  forceRevokeFailure?: boolean;
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly forceRevokeFailure: boolean;

  constructor(options: InMemorySessionRepositoryOptions = {}) {
    this.forceRevokeFailure = options.forceRevokeFailure ?? false;
  }

  async seedSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, { ...session });
  }

  async expireSession(sessionId: string): Promise<void> {
    const row = this.sessions.get(sessionId);
    if (!row) {
      return;
    }
    this.sessions.set(sessionId, {
      ...row,
      status: "EXPIRED"
    });
  }

  async getSessionById(sessionId: string): Promise<SessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async revokeAllByAccount(accountId: string, now: Date): Promise<void> {
    if (this.forceRevokeFailure) {
      throw new Error("forced revoke failure");
    }

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.accountId !== accountId || session.status !== "ACTIVE") {
        continue;
      }

      this.sessions.set(sessionId, {
        ...session,
        status: "REVOKED",
        revokedAt: now,
        revokeReason: "PASSWORD_CHANGED"
      });
    }
  }

  getActiveSessionsByAccount(accountId: string): SessionRecord[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.accountId === accountId && session.status === "ACTIVE"
    );
  }

  snapshot(): SessionRecord[] {
    return Array.from(this.sessions.values()).map((session) => ({ ...session }));
  }

  restore(snapshot: SessionRecord[]): void {
    this.sessions.clear();
    for (const session of snapshot) {
      this.sessions.set(session.sessionId, { ...session });
    }
  }
}
