import {
  validateInvitationDecisionRequest,
  type InvitationValidationViolation
} from "./reviewInvitationSchemas.js";
import {
  PrismaReviewInvitationRepository,
  ReviewInvitationConflictError,
  ReviewInvitationNotPendingError,
  ReviewInvitationRecordingFailureError
} from "../../data/review-invitations/PrismaReviewInvitationRepository.js";
import type {
  InvitationDecision,
  ReviewInvitationRepository
} from "../../data/review-invitations/ReviewInvitationRepository.js";
import { ReviewInvitationAuditService } from "../../shared/audit/reviewInvitationAudit.js";

export type RespondToReviewInvitationOutcome =
  | {
      outcome: "SUCCESS";
      invitationId: string;
      decision: "ACCEPT" | "REJECT";
      invitationStatus: "ACCEPTED" | "REJECTED";
      assignmentCreated: boolean;
      message: "Your response has been recorded.";
    }
  | {
      outcome: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: InvitationValidationViolation[];
    }
  | {
      outcome: "AUTHORIZATION_FAILED";
      code: "AUTHORIZATION_FAILED";
      message: string;
    }
  | {
      outcome: "INVITATION_NOT_FOUND";
      code: "INVITATION_NOT_FOUND";
      message: string;
    }
  | {
      outcome: "INVITATION_ALREADY_RESOLVED";
      code: "INVITATION_ALREADY_RESOLVED";
      message: string;
    }
  | {
      outcome: "RESPONSE_RECORDING_FAILED";
      code: "RESPONSE_RECORDING_FAILED";
      message: string;
    }
  | {
      outcome: "INTERNAL_ERROR";
      code: "INTERNAL_ERROR";
      message: string;
    };

interface RespondToReviewInvitationUseCaseDeps {
  repository: ReviewInvitationRepository;
  auditService: ReviewInvitationAuditService;
}

const DEFAULT_DECISION_FOR_INVALID: InvitationDecision = "REJECT";

export class RespondToReviewInvitationUseCase {
  constructor(private readonly deps: RespondToReviewInvitationUseCaseDeps) {}

  async execute(input: {
    invitationId: string;
    refereeId: string;
    requestId: string;
    body: unknown;
  }): Promise<RespondToReviewInvitationOutcome> {
    const parsed = validateInvitationDecisionRequest(input.body);

    if (!parsed.valid) {
      await this.deps.auditService.recordOutcome({
        requestId: input.requestId,
        invitationId: input.invitationId,
        refereeId: input.refereeId,
        decision: DEFAULT_DECISION_FOR_INVALID,
        outcome: "VALIDATION_FAILED",
        reasonCode: "INVALID_DECISION_VALUE"
      });

      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Invitation response validation failed.",
        violations: parsed.violations
      };
    }

    const decision = parsed.decision;

    try {
      return await this.deps.repository.withInvitationLock(input.invitationId, async () => {
        const invitation = await this.deps.repository.getInvitationById(input.invitationId);

        if (!invitation) {
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            invitationId: input.invitationId,
            refereeId: input.refereeId,
            decision,
            outcome: "INVITATION_NOT_FOUND",
            reasonCode: "INVITATION_NOT_FOUND"
          });

          return {
            outcome: "INVITATION_NOT_FOUND",
            code: "INVITATION_NOT_FOUND",
            message: "Review invitation was not found."
          };
        }

        if (invitation.refereeId !== input.refereeId) {
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            invitationId: input.invitationId,
            refereeId: input.refereeId,
            decision,
            outcome: "AUTHZ_FAILED",
            reasonCode: "AUTHORIZATION_FAILED"
          });

          return {
            outcome: "AUTHORIZATION_FAILED",
            code: "AUTHORIZATION_FAILED",
            message: "Invitation does not belong to the authenticated referee."
          };
        }

        const snapshot = this.deps.repository.snapshot();

        try {
          const recorded = await this.deps.repository.recordInvitationDecision({
            invitationId: input.invitationId,
            decision,
            refereeId: input.refereeId
          });

          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            invitationId: input.invitationId,
            refereeId: input.refereeId,
            decision,
            outcome: recorded.assignmentCreated ? "SUCCESS_ACCEPTED" : "SUCCESS_REJECTED",
            reasonCode: recorded.assignmentCreated ? "INVITATION_ACCEPTED" : "INVITATION_REJECTED"
          });

          return {
            outcome: "SUCCESS",
            invitationId: input.invitationId,
            decision,
            invitationStatus: recorded.invitationStatus,
            assignmentCreated: recorded.assignmentCreated,
            message: "Your response has been recorded."
          };
        } catch (error) {
          if (error instanceof ReviewInvitationConflictError) {
            await this.deps.auditService.recordOutcome({
              requestId: input.requestId,
              invitationId: input.invitationId,
              refereeId: input.refereeId,
              decision,
              outcome: "REJECTED_ALREADY_RESOLVED",
              reasonCode: "INVITATION_ALREADY_RESOLVED"
            });

            return {
              outcome: "INVITATION_ALREADY_RESOLVED",
              code: "INVITATION_ALREADY_RESOLVED",
              message: "Invitation has already been resolved by an earlier response."
            };
          }

          if (error instanceof ReviewInvitationNotPendingError) {
            await this.deps.auditService.recordOutcome({
              requestId: input.requestId,
              invitationId: input.invitationId,
              refereeId: input.refereeId,
              decision,
              outcome: "VALIDATION_FAILED",
              reasonCode: "INVITATION_NOT_PENDING"
            });

            return {
              outcome: "VALIDATION_FAILED",
              code: "VALIDATION_FAILED",
              message: "Invitation response validation failed.",
              violations: [
                {
                  rule: "INVITATION_NOT_PENDING",
                  message: "Invitation is not in a pending state."
                }
              ]
            };
          }

          if (error instanceof ReviewInvitationRecordingFailureError) {
            this.deps.repository.restore(snapshot);
            await this.deps.auditService.recordOutcome({
              requestId: input.requestId,
              invitationId: input.invitationId,
              refereeId: input.refereeId,
              decision,
              outcome: "RECORDING_FAILED",
              reasonCode: "RESPONSE_RECORDING_FAILED"
            });

            return {
              outcome: "RESPONSE_RECORDING_FAILED",
              code: "RESPONSE_RECORDING_FAILED",
              message: "Response could not be recorded. The invitation remains pending."
            };
          }

          this.deps.repository.restore(snapshot);
          await this.deps.auditService.recordOutcome({
            requestId: input.requestId,
            invitationId: input.invitationId,
            refereeId: input.refereeId,
            decision,
            outcome: "INTERNAL_ERROR",
            reasonCode: "INTERNAL_ERROR"
          });

          return {
            outcome: "INTERNAL_ERROR",
            code: "INTERNAL_ERROR",
            message: "Invitation response failed unexpectedly."
          };
        }
      });
    } catch (error) {
      if (error instanceof ReviewInvitationConflictError) {
        await this.deps.auditService.recordOutcome({
          requestId: input.requestId,
          invitationId: input.invitationId,
          refereeId: input.refereeId,
          decision,
          outcome: "REJECTED_ALREADY_RESOLVED",
          reasonCode: "INVITATION_ALREADY_RESOLVED"
        });

        return {
          outcome: "INVITATION_ALREADY_RESOLVED",
          code: "INVITATION_ALREADY_RESOLVED",
          message: "Invitation has already been resolved by an earlier response."
        };
      }

      await this.deps.auditService.recordOutcome({
        requestId: input.requestId,
        invitationId: input.invitationId,
        refereeId: input.refereeId,
        decision,
        outcome: "INTERNAL_ERROR",
        reasonCode: "INTERNAL_ERROR"
      });

      return {
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "Invitation response failed unexpectedly."
      };
    }
  }
}

// Keep explicit repository class export referenced for coverage discoverability.
export const REVIEW_INVITATION_REPOSITORY_CLASS_REF = PrismaReviewInvitationRepository;
