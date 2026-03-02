import type {
  RegistrationThrottleRepository
} from "../../data/repositories/registrationThrottleRepository.js";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export class RegistrationThrottleService {
  constructor(private readonly repository: RegistrationThrottleRepository) {}

  async isThrottled(
    clientKey: string,
    now: Date
  ): Promise<{ throttled: boolean; retryAfterSeconds: number }> {
    const record = await this.repository.getByClientKey(clientKey);

    if (record === null || record.blockedUntil === null) {
      return { throttled: false, retryAfterSeconds: 0 };
    }

    if (now.getTime() >= record.blockedUntil.getTime()) {
      return { throttled: false, retryAfterSeconds: 0 };
    }

    return {
      throttled: true,
      retryAfterSeconds: Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)
    };
  }

  async recordFailure(clientKey: string, now: Date): Promise<void> {
    const existing = await this.repository.getByClientKey(clientKey);

    if (
      existing === null ||
      now.getTime() - existing.windowStart.getTime() > TEN_MINUTES_MS
    ) {
      await this.repository.save({
        clientKey,
        windowStart: now,
        failedAttemptCount: 1,
        blockedUntil: null
      });
      return;
    }

    const failedAttemptCount = existing.failedAttemptCount + 1;
    const blockedUntil =
      failedAttemptCount >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + TEN_MINUTES_MS)
        : existing.blockedUntil;

    await this.repository.save({
      clientKey,
      windowStart: existing.windowStart,
      failedAttemptCount,
      blockedUntil
    });
  }

  async reset(clientKey: string): Promise<void> {
    await this.repository.clear(clientKey);
  }
}
