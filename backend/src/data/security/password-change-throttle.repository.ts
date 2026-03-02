export interface PasswordChangeThrottleRecord {
  key: string;
  windowStart: Date;
  failedCount: number;
  blockedUntil: Date | null;
}

export interface PasswordChangeThrottleRepository {
  getByKey(key: string): Promise<PasswordChangeThrottleRecord | null>;
  save(record: PasswordChangeThrottleRecord): Promise<void>;
  clear(key: string): Promise<void>;
}

export class InMemoryPasswordChangeThrottleRepository implements PasswordChangeThrottleRepository {
  private readonly records = new Map<string, PasswordChangeThrottleRecord>();

  async getByKey(key: string): Promise<PasswordChangeThrottleRecord | null> {
    return this.records.get(key) ?? null;
  }

  async save(record: PasswordChangeThrottleRecord): Promise<void> {
    this.records.set(record.key, record);
  }

  async clear(key: string): Promise<void> {
    this.records.delete(key);
  }
}
