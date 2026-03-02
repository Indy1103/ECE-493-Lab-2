import { randomUUID } from "node:crypto";

export interface AccountCredentialState {
  accountId: string;
  passwordHash: string;
  credentialVersion: number;
  updatedAt: Date;
  passwordHistoryHashes: string[];
}

export interface PasswordChangeAttemptRecord {
  id: string;
  accountId: string;
  sessionId: string | null;
  sourceIp: string;
  outcome: "SUCCESS" | "VALIDATION_FAILED" | "THROTTLED" | "OPERATIONAL_FAILED" | "CONFLICT";
  reasonCode: string;
  occurredAt: Date;
  requestId: string;
}

export interface AccountCredentialRepository {
  getCredentialState(accountId: string): Promise<AccountCredentialState | null>;
  updateCredential(input: {
    accountId: string;
    expectedVersion: number;
    newPasswordHash: string;
    now: Date;
  }): Promise<{ conflict: boolean; previousPasswordHash?: string }>;
  appendPasswordHistory(accountId: string, passwordHash: string, now: Date): Promise<void>;
  prunePasswordHistory(accountId: string, keepLatest: number): Promise<void>;
  recordAttempt(attempt: PasswordChangeAttemptRecord): Promise<void>;
  snapshot(): AccountCredentialSnapshot;
  restore(snapshot: AccountCredentialSnapshot): void;
}

export interface AccountCredentialSnapshot {
  credentials: Map<string, { passwordHash: string; credentialVersion: number; updatedAt: Date }>;
  history: Map<string, Array<{ id: string; passwordHash: string; createdAt: Date }>>;
  attempts: PasswordChangeAttemptRecord[];
}

interface InMemoryAccountCredentialRepositoryOptions {
  forceConflict?: boolean;
}

export class InMemoryAccountCredentialRepository implements AccountCredentialRepository {
  private readonly credentials = new Map<
    string,
    { passwordHash: string; credentialVersion: number; updatedAt: Date }
  >();
  private readonly history = new Map<string, Array<{ id: string; passwordHash: string; createdAt: Date }>>();
  private readonly attempts: PasswordChangeAttemptRecord[] = [];
  private readonly forceConflict: boolean;

  constructor(options: InMemoryAccountCredentialRepositoryOptions = {}) {
    this.forceConflict = options.forceConflict ?? false;
  }

  async seedCredential(input: {
    accountId: string;
    passwordHash: string;
    credentialVersion: number;
  }): Promise<void> {
    this.credentials.set(input.accountId, {
      passwordHash: input.passwordHash,
      credentialVersion: input.credentialVersion,
      updatedAt: new Date("2026-02-09T12:00:00.000Z")
    });
  }

  async getCredentialState(accountId: string): Promise<AccountCredentialState | null> {
    const row = this.credentials.get(accountId);
    if (!row) {
      return null;
    }

    const accountHistory = this.history.get(accountId) ?? [];

    return {
      accountId,
      passwordHash: row.passwordHash,
      credentialVersion: row.credentialVersion,
      updatedAt: row.updatedAt,
      passwordHistoryHashes: accountHistory.map((entry) => entry.passwordHash)
    };
  }

  async updateCredential(input: {
    accountId: string;
    expectedVersion: number;
    newPasswordHash: string;
    now: Date;
  }): Promise<{ conflict: boolean; previousPasswordHash?: string }> {
    const row = this.credentials.get(input.accountId);
    if (!row) {
      return { conflict: true };
    }

    if (this.forceConflict || row.credentialVersion !== input.expectedVersion) {
      return { conflict: true };
    }

    const previousPasswordHash = row.passwordHash;
    this.credentials.set(input.accountId, {
      passwordHash: input.newPasswordHash,
      credentialVersion: row.credentialVersion + 1,
      updatedAt: input.now
    });

    return {
      conflict: false,
      previousPasswordHash
    };
  }

  async appendPasswordHistory(accountId: string, passwordHash: string, now: Date): Promise<void> {
    const current = this.history.get(accountId) ?? [];
    current.unshift({ id: randomUUID(), passwordHash, createdAt: now });
    this.history.set(accountId, current);
  }

  async prunePasswordHistory(accountId: string, keepLatest: number): Promise<void> {
    const current = this.history.get(accountId) ?? [];
    this.history.set(accountId, current.slice(0, keepLatest));
  }

  async recordAttempt(attempt: PasswordChangeAttemptRecord): Promise<void> {
    this.attempts.push(attempt);
  }

  getHistoryByAccount(accountId: string): Array<{ id: string; passwordHash: string; createdAt: Date }> {
    return this.history.get(accountId) ?? [];
  }

  getAttempts(): PasswordChangeAttemptRecord[] {
    return this.attempts;
  }

  snapshot(): AccountCredentialSnapshot {
    return {
      credentials: new Map(this.credentials),
      history: new Map(
        Array.from(this.history.entries()).map(([key, value]) => [
          key,
          value.map((entry) => ({ ...entry }))
        ])
      ),
      attempts: this.attempts.map((attempt) => ({ ...attempt }))
    };
  }

  restore(snapshot: AccountCredentialSnapshot): void {
    this.credentials.clear();
    for (const [key, value] of snapshot.credentials.entries()) {
      this.credentials.set(key, { ...value });
    }

    this.history.clear();
    for (const [key, value] of snapshot.history.entries()) {
      this.history.set(
        key,
        value.map((entry) => ({ ...entry }))
      );
    }

    this.attempts.length = 0;
    for (const attempt of snapshot.attempts) {
      this.attempts.push({ ...attempt });
    }
  }
}
