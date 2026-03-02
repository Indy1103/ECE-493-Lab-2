import { randomUUID } from "node:crypto";

import type { PasswordChangeOutcome, PasswordChangeRequestInput } from "../domain/password-change.js";
import type { PasswordHashService } from "../security/password-hash.service.js";
import type { AccountCredentialRepository } from "../../data/account/account-credential.repository.js";
import type { PasswordChangeThrottleService } from "../security/password-change-throttle.service.js";
import type { PasswordChangeAuditService } from "../observability/password-change-audit.service.js";
import type { SessionRevocationService } from "../security/session-revocation.service.js";
import type { PasswordChangeValidationService } from "./password-change-validation.service.js";

interface ChangePasswordServiceDeps {
  credentialRepository: AccountCredentialRepository;
  hashService: Pick<PasswordHashService, "hash">;
  validationService: Pick<PasswordChangeValidationService, "validate">;
  throttleService: Pick<
    PasswordChangeThrottleService,
    "isThrottled" | "recordFailure" | "clearFailures"
  >;
  auditService: PasswordChangeAuditService;
  sessionRevocationService: Pick<SessionRevocationService, "revokeAll" | "snapshot" | "restore">;
  nowProvider?: () => Date;
}

export class ChangePasswordService {
  private readonly nowProvider: () => Date;

  constructor(private readonly deps: ChangePasswordServiceDeps) {
    this.nowProvider = deps.nowProvider ?? (() => new Date());
  }

  async execute(input: PasswordChangeRequestInput): Promise<PasswordChangeOutcome> {
    const now = this.nowProvider();

    const throttled = await this.deps.throttleService.isThrottled(
      input.accountId,
      input.sourceIp,
      now
    );
    if (throttled.throttled) {
      await this.recordAttempt(input, now, "THROTTLED", "PASSWORD_CHANGE_THROTTLED");
      return {
        outcome: "THROTTLED",
        code: "PASSWORD_CHANGE_THROTTLED",
        message: "Too many failed password change attempts. Please try again later.",
        retryAfterSeconds: throttled.retryAfterSeconds
      };
    }

    const validation = await this.deps.validationService.validate({
      accountId: input.accountId,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      confirmNewPassword: input.confirmNewPassword
    });

    if (!validation.valid) {
      await this.deps.throttleService.recordFailure(input.accountId, input.sourceIp, now);
      await this.recordAttempt(input, now, "VALIDATION_FAILED", "VALIDATION_FAILED");
      return {
        outcome: "VALIDATION_FAILED",
        message: "Password change validation failed.",
        violations: validation.violations
      };
    }

    const credentialSnapshot = this.deps.credentialRepository.snapshot();
    const sessionSnapshot = this.deps.sessionRevocationService.snapshot();
    const auditSnapshot = this.deps.auditService.snapshot();

    try {
      const newPasswordHash = await this.deps.hashService.hash(input.newPassword);
      const updateResult = await this.deps.credentialRepository.updateCredential({
        accountId: input.accountId,
        expectedVersion: validation.credentialVersion,
        newPasswordHash,
        now
      });

      if (updateResult.conflict || !updateResult.previousPasswordHash) {
        await this.recordAttempt(input, now, "CONFLICT", "CREDENTIAL_VERSION_CONFLICT");
        return {
          outcome: "CONFLICT",
          code: "CREDENTIAL_VERSION_CONFLICT",
          message: "Password change conflicted with another update. Please retry."
        };
      }

      await this.deps.credentialRepository.appendPasswordHistory(
        input.accountId,
        updateResult.previousPasswordHash,
        now
      );
      await this.deps.credentialRepository.prunePasswordHistory(input.accountId, 5);
      await this.deps.sessionRevocationService.revokeAll(input.accountId, now);
      await this.deps.throttleService.clearFailures(input.accountId, input.sourceIp);
      await this.recordAttempt(input, now, "SUCCESS", "PASSWORD_CHANGED", true);

      return {
        outcome: "SUCCESS",
        message: "Password changed successfully. Please sign in again.",
        reauthenticationRequired: true
      };
    } catch {
      this.deps.credentialRepository.restore(credentialSnapshot);
      this.deps.sessionRevocationService.restore(sessionSnapshot);
      this.deps.auditService.restore(auditSnapshot);

      await this.recordAttempt(input, now, "OPERATIONAL_FAILED", "PASSWORD_CHANGE_UNAVAILABLE");

      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "PASSWORD_CHANGE_UNAVAILABLE",
        message: "Password change is temporarily unavailable. Please try again."
      };
    }
  }

  private async recordAttempt(
    input: PasswordChangeRequestInput,
    now: Date,
    outcome: "SUCCESS" | "VALIDATION_FAILED" | "THROTTLED" | "OPERATIONAL_FAILED" | "CONFLICT",
    reasonCode: string,
    strictAudit = false
  ): Promise<void> {
    await this.deps.credentialRepository.recordAttempt({
      id: randomUUID(),
      accountId: input.accountId,
      sessionId: input.sessionId,
      sourceIp: input.sourceIp,
      outcome,
      reasonCode,
      occurredAt: now,
      requestId: input.requestId
    });

    const event = {
      timestamp: now.toISOString(),
      accountId: input.accountId,
      sourceIp: input.sourceIp,
      sessionId: input.sessionId,
      outcome,
      reasonCode,
      requestId: input.requestId
    } as const;

    if (strictAudit) {
      await this.deps.auditService.recordAttempt(event);
      return;
    }

    try {
      await this.deps.auditService.recordAttempt(event);
    } catch {
      // Ignore secondary audit failures outside strict success-path guarantees.
    }
  }
}
