import type {
  AuthAccount,
  AuthDataProtectionSnapshot,
  AuthenticatedSession,
  AuthRepository,
  CreateSessionInput,
  LoginAttemptRecord
} from "./auth.repository.js";

interface InMemoryLoginRepositoryOptions {
  forceProcessingFailure?: boolean;
}

export class InMemoryLoginRepository implements AuthRepository {
  private readonly accounts = new Map<string, AuthAccount>();
  private readonly attempts: LoginAttemptRecord[] = [];
  private readonly sessions: AuthenticatedSession[] = [];
  private readonly forceProcessingFailure: boolean;
  private sessionSequence = 0;
  private dataProtectionSnapshot: AuthDataProtectionSnapshot = {
    primaryRecordsEncrypted: true,
    backupsEncrypted: true
  };

  constructor(options: InMemoryLoginRepositoryOptions = {}) {
    this.forceProcessingFailure = options.forceProcessingFailure ?? false;
  }

  async seedAccount(account: AuthAccount): Promise<void> {
    this.accounts.set(account.username.trim().toLowerCase(), account);
  }

  async findAccountByUsername(username: string): Promise<AuthAccount | null> {
    return this.accounts.get(username.trim().toLowerCase()) ?? null;
  }

  async createSession(input: CreateSessionInput): Promise<AuthenticatedSession> {
    if (this.forceProcessingFailure) {
      throw new Error("forced processing failure");
    }

    this.sessionSequence += 1;
    const session: AuthenticatedSession = {
      sessionId: `00000000-0000-4000-8000-${String(this.sessionSequence).padStart(12, "0")}`,
      userId: input.userId,
      role: input.role,
      issuedAt: input.now,
      expiresAt: new Date(input.now.getTime() + 60 * 60 * 1000),
      lastActivityAt: input.now,
      requestId: input.requestId,
      status: "ACTIVE"
    };

    this.sessions.push(session);
    return session;
  }

  async recordAttempt(attempt: LoginAttemptRecord): Promise<void> {
    this.attempts.push(attempt);
  }

  async getDataProtectionSnapshot(): Promise<AuthDataProtectionSnapshot> {
    return this.dataProtectionSnapshot;
  }

  async setDataProtectionSnapshot(snapshot: AuthDataProtectionSnapshot): Promise<void> {
    this.dataProtectionSnapshot = snapshot;
  }

  getAttempts(): LoginAttemptRecord[] {
    return this.attempts;
  }

  getSessions(): AuthenticatedSession[] {
    return this.sessions;
  }
}
