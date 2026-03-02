import { LoginThrottlePolicy } from "./throttle-policy.js";

interface LoginFailureUseCaseDeps {
  throttlePolicy: LoginThrottlePolicy;
}

export class LoginFailureUseCase {
  constructor(private readonly deps: LoginFailureUseCaseDeps) {}

  async checkThrottle(
    clientKey: string,
    now: Date
  ): Promise<{ throttled: boolean; retryAfterSeconds: number }> {
    return this.deps.throttlePolicy.isThrottled(clientKey, now);
  }

  async registerFailedAttempt(clientKey: string, now: Date): Promise<void> {
    await this.deps.throttlePolicy.recordFailure(clientKey, now);
  }

  async clearFailedAttempts(clientKey: string): Promise<void> {
    await this.deps.throttlePolicy.clear(clientKey);
  }
}
