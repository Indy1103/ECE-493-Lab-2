export interface LoginThrottleRecord {
  clientKey: string;
  windowStart: Date;
  failedAttemptCount: number;
  blockedUntil: Date | null;
}

export interface LoginThrottleRepository {
  getByClientKey(clientKey: string): Promise<LoginThrottleRecord | null>;
  save(record: LoginThrottleRecord): Promise<void>;
  clear(clientKey: string): Promise<void>;
}

export class InMemoryLoginThrottleRepository implements LoginThrottleRepository {
  private readonly records = new Map<string, LoginThrottleRecord>();

  async getByClientKey(clientKey: string): Promise<LoginThrottleRecord | null> {
    return this.records.get(clientKey) ?? null;
  }

  async save(record: LoginThrottleRecord): Promise<void> {
    this.records.set(record.clientKey, record);
  }

  async clear(clientKey: string): Promise<void> {
    this.records.delete(clientKey);
  }
}
