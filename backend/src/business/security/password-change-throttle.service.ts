import type {
  PasswordChangeThrottleRecord,
  PasswordChangeThrottleRepository
} from "../../data/security/password-change-throttle.repository.js";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const FAILURE_THRESHOLD = 5;

interface ThrottleSnapshot {
  accountRecord: PasswordChangeThrottleRecord | null;
  ipRecord: PasswordChangeThrottleRecord | null;
}

export class PasswordChangeThrottleService {
  constructor(private readonly repository: PasswordChangeThrottleRepository) {}

  private accountKey(accountId: string): string {
    return `account:${accountId}`;
  }

  private ipKey(sourceIp: string): string {
    return `ip:${sourceIp}`;
  }

  private async buildSnapshot(accountId: string, sourceIp: string): Promise<ThrottleSnapshot> {
    const accountRecord = await this.repository.getByKey(this.accountKey(accountId));
    const ipRecord = await this.repository.getByKey(this.ipKey(sourceIp));
    return { accountRecord, ipRecord };
  }

  private retryAfterSeconds(record: PasswordChangeThrottleRecord, now: Date): number {
    if (!record.blockedUntil) {
      return 0;
    }
    return Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
  }

  async isThrottled(
    accountId: string,
    sourceIp: string,
    now: Date
  ): Promise<{ throttled: boolean; retryAfterSeconds: number }> {
    const snapshot = await this.buildSnapshot(accountId, sourceIp);
    const retryCandidates: number[] = [];

    for (const record of [snapshot.accountRecord, snapshot.ipRecord]) {
      if (!record || !record.blockedUntil) {
        continue;
      }

      if (record.blockedUntil.getTime() <= now.getTime()) {
        continue;
      }

      retryCandidates.push(this.retryAfterSeconds(record, now));
    }

    if (retryCandidates.length === 0) {
      return { throttled: false, retryAfterSeconds: 0 };
    }

    return {
      throttled: true,
      retryAfterSeconds: Math.max(...retryCandidates)
    };
  }

  private async increment(key: string, now: Date): Promise<void> {
    const record = await this.repository.getByKey(key);
    if (!record || now.getTime() - record.windowStart.getTime() > WINDOW_MS) {
      await this.repository.save({
        key,
        windowStart: now,
        failedCount: 1,
        blockedUntil: null
      });
      return;
    }

    const failedCount = record.failedCount + 1;
    const blockedUntil =
      failedCount >= FAILURE_THRESHOLD ? new Date(now.getTime() + LOCK_MS) : record.blockedUntil;

    await this.repository.save({
      key,
      windowStart: record.windowStart,
      failedCount,
      blockedUntil
    });
  }

  async recordFailure(accountId: string, sourceIp: string, now: Date): Promise<void> {
    await this.increment(this.accountKey(accountId), now);
    await this.increment(this.ipKey(sourceIp), now);
  }

  async clearFailures(accountId: string, sourceIp: string): Promise<void> {
    await this.repository.clear(this.accountKey(accountId));
    await this.repository.clear(this.ipKey(sourceIp));
  }
}
