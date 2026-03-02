import {
  type DraftValidationViolation,
  getActiveDraftPolicyVersion,
  validateDraftSaveInput
} from "./draftValidation.js";
import {
  SubmissionDraftAuthorizationError,
  SubmissionDraftOwnershipGuard
} from "../../security/submissionDraftOwnership.js";
import type { SubmissionDraftRepository } from "../../data/submission-drafts/SubmissionDraftRepository.js";
import { ConcurrentSaveResolutionError } from "../../data/submission-drafts/PrismaSubmissionDraftRepository.js";
import { SubmissionDraftAuditService } from "../../shared/audit/submissionDraftAudit.js";

export type SaveSubmissionDraftOutcome =
  | {
      outcome: "SUCCESS";
      submissionId: string;
      savedAt: string;
      message: "Draft saved successfully.";
      policyVersion: string;
    }
  | {
      outcome: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: DraftValidationViolation[];
    }
  | {
      outcome: "AUTHORIZATION_FAILED";
      code: "AUTHORIZATION_FAILED";
      message: string;
    }
  | {
      outcome: "CONCURRENT_SAVE_RESOLVED";
      code: "CONCURRENT_SAVE_RESOLVED";
      message: string;
    }
  | {
      outcome: "OPERATIONAL_FAILURE";
      code: "OPERATIONAL_FAILURE";
      message: string;
    };

interface SaveSubmissionDraftUseCaseDeps {
  repository: SubmissionDraftRepository;
  ownershipGuard: SubmissionDraftOwnershipGuard;
  auditService: SubmissionDraftAuditService;
}

export class SaveSubmissionDraftUseCase {
  constructor(private readonly deps: SaveSubmissionDraftUseCaseDeps) {}

  async execute(input: {
    authorId: string;
    submissionId: string;
    requestId: string;
    body: unknown;
  }): Promise<SaveSubmissionDraftOutcome> {
    try {
      await this.deps.ownershipGuard.assertOwnership(input.authorId, input.submissionId);
    } catch (error) {
      if (error instanceof SubmissionDraftAuthorizationError) {
        await this.deps.auditService.recordAttempt({
          authorId: input.authorId,
          submissionId: input.submissionId,
          requestId: input.requestId,
          outcome: "AUTHZ_FAILED",
          reasonCode: "AUTHORIZATION_FAILED"
        });

        return {
          outcome: "AUTHORIZATION_FAILED",
          code: "AUTHORIZATION_FAILED",
          message: "You are not authorized to access this submission draft."
        };
      }

      await this.deps.auditService.recordAttempt({
        authorId: input.authorId,
        submissionId: input.submissionId,
        requestId: input.requestId,
        outcome: "OPERATIONAL_FAILED",
        reasonCode: "OWNERSHIP_LOOKUP_FAILED"
      });

      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "OPERATIONAL_FAILURE",
        message: "Draft could not be saved. Please retry."
      };
    }

    const validation = validateDraftSaveInput(input.body);
    if (!validation.valid) {
      await this.deps.auditService.recordAttempt({
        authorId: input.authorId,
        submissionId: input.submissionId,
        requestId: input.requestId,
        outcome: "VALIDATION_FAILED",
        reasonCode: "VALIDATION_FAILED"
      });

      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Draft validation failed.",
        violations: validation.violations
      };
    }

    const snapshot = this.deps.repository.snapshot();

    try {
      const policyVersion = getActiveDraftPolicyVersion();
      const saved = await this.deps.repository.saveDraft({
        authorId: input.authorId,
        submissionId: input.submissionId,
        title: validation.value.title,
        draftPayload: validation.value.draftPayload,
        policyVersion
      });

      await this.deps.auditService.recordAttempt({
        authorId: input.authorId,
        submissionId: input.submissionId,
        requestId: input.requestId,
        outcome: "SUCCESS",
        reasonCode: "DRAFT_SAVED"
      });

      return {
        outcome: "SUCCESS",
        submissionId: saved.submissionId,
        savedAt: saved.savedAt.toISOString(),
        message: "Draft saved successfully.",
        policyVersion
      };
    } catch (error) {
      this.deps.repository.restore(snapshot);

      if (error instanceof ConcurrentSaveResolutionError) {
        await this.deps.auditService.recordAttempt({
          authorId: input.authorId,
          submissionId: input.submissionId,
          requestId: input.requestId,
          outcome: "CONCURRENT_SAVE_RESOLVED",
          reasonCode: "CONCURRENT_SAVE_RESOLVED"
        });

        return {
          outcome: "CONCURRENT_SAVE_RESOLVED",
          code: "CONCURRENT_SAVE_RESOLVED",
          message: "A concurrent draft save was resolved. Latest valid state is preserved."
        };
      }

      await this.deps.auditService.recordAttempt({
        authorId: input.authorId,
        submissionId: input.submissionId,
        requestId: input.requestId,
        outcome: "OPERATIONAL_FAILED",
        reasonCode: "OPERATIONAL_FAILURE"
      });

      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "OPERATIONAL_FAILURE",
        message: "Draft could not be saved. Please retry."
      };
    }
  }
}
