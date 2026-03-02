import { randomUUID } from "node:crypto";

import { DuplicateFinalSubmissionError, FinalSubmissionGuard } from "./final-submission-guard.js";
import { ReviewSubmissionEligibilityPolicy } from "./eligibility-policy.js";
import type {
  AssignmentEligibilityRepository,
  ReviewSubmissionRepository
} from "./ports.js";
import { ReviewValidationPolicy, type ValidationIssue } from "./review-validation-policy.js";
import {
  REVIEW_SUBMISSION_OUTCOMES,
  REVIEW_SUBMISSION_REASON_CODES,
  type ReviewSubmissionReasonCode
} from "./submission-outcome.js";
import { ReviewSubmissionAuditLogger } from "./audit-logger.js";
import { ReviewSubmissionConflictError } from "../../data/review-submission/review-submission.repository.js";

export type GetReviewFormOutcome =
  | {
      outcome: "REVIEW_FORM_AVAILABLE";
      messageCode: "REVIEW_FORM_AVAILABLE";
      assignmentId: string;
      formVersion: string;
      fields: Array<{ fieldId: string; required: boolean; constraints?: string[] }>;
    }
  | {
      outcome: "SUBMISSION_UNAVAILABLE";
      messageCode: "submission-unavailable";
      message: string;
      reasonCode: "non-owned-or-non-assigned";
      statusCode: 404;
    };

export type SubmitReviewOutcome =
  | {
      outcome: "REVIEW_SUBMISSION_ACCEPTED";
      messageCode: "REVIEW_SUBMISSION_ACCEPTED";
      submissionId: string;
      submittedAt: string;
    }
  | {
      outcome: "VALIDATION_FAILED";
      messageCode: "validation-failed";
      message: string;
      issues: ValidationIssue[];
    }
  | {
      outcome: "SUBMISSION_UNAVAILABLE";
      messageCode: "submission-unavailable";
      message: string;
      reasonCode: "non-owned-or-non-assigned" | "submit-time-ineligible" | "duplicate-final-submission";
      statusCode: 404 | 409;
    };

interface SubmitReviewServiceDeps {
  eligibilityRepository: Pick<AssignmentEligibilityRepository, "getByAssignmentId">;
  submissionRepository: Pick<
    ReviewSubmissionRepository,
    "withAssignmentLock" | "getByAssignmentId" | "createFinalSubmission"
  >;
  eligibilityPolicy: ReviewSubmissionEligibilityPolicy;
  validationPolicy: ReviewValidationPolicy;
  finalSubmissionGuard: FinalSubmissionGuard;
  auditLogger: ReviewSubmissionAuditLogger;
  nowProvider?: () => Date;
}

function resolveUnavailableMessage(reasonCode: ReviewSubmissionReasonCode): string {
  switch (reasonCode) {
    case REVIEW_SUBMISSION_REASON_CODES.DUPLICATE_FINAL_SUBMISSION:
      return "This review has already been submitted.";
    case REVIEW_SUBMISSION_REASON_CODES.SUBMIT_TIME_INELIGIBLE:
      return "This review submission is no longer available.";
    default:
      return "This review submission is unavailable.";
  }
}

export class SubmitReviewService {
  private readonly nowProvider: () => Date;

  constructor(private readonly deps: SubmitReviewServiceDeps) {
    this.nowProvider = deps.nowProvider ?? (() => new Date());
  }

  async getReviewForm(input: {
    refereeUserId: string;
    assignmentId: string;
    requestId: string;
  }): Promise<GetReviewFormOutcome> {
    let eligibility: Awaited<ReturnType<AssignmentEligibilityRepository["getByAssignmentId"]>> = null;
    try {
      eligibility = await this.deps.eligibilityRepository.getByAssignmentId(input.assignmentId);
    } catch {
      eligibility = null;
    }
    const decision = this.deps.eligibilityPolicy.evaluateFormAccess(eligibility, input.refereeUserId);

    if (!decision.allowed) {
      await this.deps.auditLogger.record({
        actorUserId: input.refereeUserId,
        assignmentId: input.assignmentId,
        paperId: eligibility?.paperId ?? null,
        outcome: "submission-unavailable",
        reasonCode: decision.reasonCode,
        metadata: { requestId: input.requestId }
      });

      return {
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
        message: resolveUnavailableMessage(decision.reasonCode),
        reasonCode: decision.reasonCode,
        statusCode: 404
      };
    }

    return {
      outcome: "REVIEW_FORM_AVAILABLE",
      messageCode: REVIEW_SUBMISSION_OUTCOMES.REVIEW_FORM_AVAILABLE,
      assignmentId: decision.eligibility.assignmentId,
      formVersion: decision.eligibility.reviewForm.formVersion,
      fields: decision.eligibility.reviewForm.fields
    };
  }

  async submitReview(input: {
    refereeUserId: string;
    assignmentId: string;
    requestId: string;
    payload: { responses?: unknown };
  }): Promise<SubmitReviewOutcome> {
    let eligibility: Awaited<ReturnType<AssignmentEligibilityRepository["getByAssignmentId"]>> = null;
    try {
      eligibility = await this.deps.eligibilityRepository.getByAssignmentId(input.assignmentId);
    } catch {
      eligibility = null;
    }
    const decision = this.deps.eligibilityPolicy.evaluateSubmissionEligibility(
      eligibility,
      input.refereeUserId
    );

    if (!decision.allowed) {
      await this.deps.auditLogger.record({
        actorUserId: input.refereeUserId,
        assignmentId: input.assignmentId,
        paperId: eligibility?.paperId ?? null,
        outcome: "submission-unavailable",
        reasonCode: decision.reasonCode,
        metadata: { requestId: input.requestId }
      });

      return {
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
        message: resolveUnavailableMessage(decision.reasonCode),
        reasonCode: decision.reasonCode,
        statusCode: decision.statusCode
      };
    }

    const validation = this.deps.validationPolicy.validateSubmission(
      input.payload,
      decision.eligibility.reviewForm.fields
    );

    if (!validation.valid) {
      await this.deps.auditLogger.record({
        actorUserId: input.refereeUserId,
        assignmentId: decision.eligibility.assignmentId,
        paperId: decision.eligibility.paperId,
        outcome: "validation-failed",
        reasonCode: REVIEW_SUBMISSION_OUTCOMES.VALIDATION_FAILED,
        metadata: {
          requestId: input.requestId,
          issueCount: validation.issues.length,
          responses: input.payload.responses
        }
      });

      return {
        outcome: "VALIDATION_FAILED",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.VALIDATION_FAILED,
        message: "Please correct the highlighted review form fields.",
        issues: validation.issues
      };
    }

    return this.deps.submissionRepository.withAssignmentLock(input.assignmentId, async () => {
      try {
        await this.deps.finalSubmissionGuard.ensureNoFinalSubmission(input.assignmentId);

        const responses =
          input.payload.responses && typeof input.payload.responses === "object"
            ? (input.payload.responses as Record<string, unknown>)
            : {};

        const created = await this.deps.submissionRepository.createFinalSubmission({
          assignmentId: decision.eligibility.assignmentId,
          paperId: decision.eligibility.paperId,
          refereeUserId: input.refereeUserId,
          content: responses
        });

        await this.deps.auditLogger.record({
          actorUserId: input.refereeUserId,
          assignmentId: decision.eligibility.assignmentId,
          paperId: decision.eligibility.paperId,
          outcome: "submitted",
          reasonCode: "submitted",
          metadata: {
            requestId: input.requestId,
            submissionId: created.id
          }
        });

        return {
          outcome: "REVIEW_SUBMISSION_ACCEPTED" as const,
          messageCode: REVIEW_SUBMISSION_OUTCOMES.REVIEW_SUBMISSION_ACCEPTED,
          submissionId: created.id || randomUUID(),
          submittedAt: created.submittedAt.toISOString()
        };
      } catch (error) {
        const reasonCode =
          error instanceof DuplicateFinalSubmissionError || error instanceof ReviewSubmissionConflictError
            ? REVIEW_SUBMISSION_REASON_CODES.DUPLICATE_FINAL_SUBMISSION
            : REVIEW_SUBMISSION_REASON_CODES.SUBMIT_TIME_INELIGIBLE;

        await this.deps.auditLogger.record({
          actorUserId: input.refereeUserId,
          assignmentId: decision.eligibility.assignmentId,
          paperId: decision.eligibility.paperId,
          outcome: "submission-unavailable",
          reasonCode,
          metadata: {
            requestId: input.requestId,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        });

        return {
          outcome: "SUBMISSION_UNAVAILABLE",
          messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
          message: resolveUnavailableMessage(reasonCode),
          reasonCode,
          statusCode: 409
        };
      }
    });
  }
}
