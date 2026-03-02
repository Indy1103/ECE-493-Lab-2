export interface RegistrationThrottleRecord {
  clientKey: string;
  windowStart: Date;
  failedAttemptCount: number;
  blockedUntil: Date | null;
}

export interface RegistrationThrottleRepository {
  getByClientKey(clientKey: string): Promise<RegistrationThrottleRecord | null>;
  save(record: RegistrationThrottleRecord): Promise<void>;
  clear(clientKey: string): Promise<void>;
}

export class InMemoryRegistrationThrottleRepository
  implements RegistrationThrottleRepository
{
  private readonly records = new Map<string, RegistrationThrottleRecord>();

  async getByClientKey(clientKey: string): Promise<RegistrationThrottleRecord | null> {
    return this.records.get(clientKey) ?? null;
  }

  async save(record: RegistrationThrottleRecord): Promise<void> {
    this.records.set(record.clientKey, record);
  }

  async clear(clientKey: string): Promise<void> {
    this.records.delete(clientKey);
  }
}
