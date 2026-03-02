import type { AccountCredentialRepository } from "../../data/account/account-credential.repository.js";
import type { PasswordHashService } from "../security/password-hash.service.js";
import { PasswordChangeRequestSchema } from "../validation/password-change.schema.js";
import type { PasswordChangeOutcome } from "../domain/password-change.js";

interface PasswordChangeValidationServiceDeps {
  credentialRepository: AccountCredentialRepository;
  hashService: Pick<PasswordHashService, "verify">;
}

type ValidationViolation = { field: string; rule: string; message: string };

export type PasswordChangeValidationResult =
  | {
      valid: true;
      credentialVersion: number;
      currentPasswordHash: string;
    }
  | {
      valid: false;
      violations: ValidationViolation[];
    };

export class PasswordChangeValidationService {
  constructor(private readonly deps: PasswordChangeValidationServiceDeps) {}

  async validate(input: {
    accountId: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<PasswordChangeValidationResult> {
    const violations: ValidationViolation[] = [];
    const parsed = PasswordChangeRequestSchema.safeParse({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      confirmNewPassword: input.confirmNewPassword
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "request");
        violations.push({
          field,
          rule: issue.code,
          message: issue.message
        });
      }
      return { valid: false, violations };
    }

    if (parsed.data.newPassword !== parsed.data.confirmNewPassword) {
      violations.push({
        field: "confirmNewPassword",
        rule: "password_confirmation_mismatch",
        message: "New password and confirmation must match."
      });
    }

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      violations.push({
        field: "newPassword",
        rule: "new_password_must_differ",
        message: "New password must be different from current password."
      });
    }

    const state = await this.deps.credentialRepository.getCredentialState(input.accountId);
    if (!state) {
      violations.push({
        field: "currentPassword",
        rule: "current_password_mismatch",
        message: "Current password is incorrect."
      });
      return { valid: false, violations };
    }

    const currentPasswordMatches = await this.deps.hashService.verify(
      state.passwordHash,
      parsed.data.currentPassword
    );
    if (!currentPasswordMatches) {
      violations.push({
        field: "currentPassword",
        rule: "current_password_mismatch",
        message: "Current password is incorrect."
      });
    }

    const allRecentHashes = [state.passwordHash, ...state.passwordHistoryHashes.slice(0, 5)];

    for (const hash of allRecentHashes) {
      const reused = await this.deps.hashService.verify(hash, parsed.data.newPassword);
      if (!reused) {
        continue;
      }
      violations.push({
        field: "newPassword",
        rule: "password_history_reuse",
        message: "New password must not match your last 5 passwords."
      });
      break;
    }

    if (violations.length > 0) {
      return { valid: false, violations };
    }

    return {
      valid: true,
      credentialVersion: state.credentialVersion,
      currentPasswordHash: state.passwordHash
    };
  }
}

export function mapValidationOutcome(
  violations: Array<{ field: string; rule: string; message: string }>
): Extract<PasswordChangeOutcome, { outcome: "VALIDATION_FAILED" }> {
  return {
    outcome: "VALIDATION_FAILED",
    message: "Password change validation failed.",
    violations
  };
}
