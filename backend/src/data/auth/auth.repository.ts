export type LoginAttemptOutcome =
  | "AUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "THROTTLED"
  | "ROLE_MAPPING_UNAVAILABLE"
  | "PROCESSING_FAILURE";

export interface AuthAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
}

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  role: string;
  issuedAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  requestId: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

export interface LoginAttemptRecord {
  attemptId: string;
  usernameSubmitted: string;
  attemptedAt: Date;
  clientKey: string;
  outcome: LoginAttemptOutcome;
  requestId: string;
}

export interface AuthDataProtectionSnapshot {
  primaryRecordsEncrypted: boolean;
  backupsEncrypted: boolean;
}

export interface CreateSessionInput {
  userId: string;
  role: string;
  requestId: string;
  now: Date;
}

export interface AuthRepository {
  findAccountByUsername(username: string): Promise<AuthAccount | null>;
  createSession(input: CreateSessionInput): Promise<AuthenticatedSession>;
  recordAttempt(attempt: LoginAttemptRecord): Promise<void>;
  getDataProtectionSnapshot(): Promise<AuthDataProtectionSnapshot>;
}
