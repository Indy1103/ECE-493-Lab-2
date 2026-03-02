import { DecisionAuditLogger } from "./audit-logger.js";
import { DecisionCompletionGate } from "./completion-gate.js";
import {
  FINAL_DECISION_OUTCOMES,
  FINAL_DECISION_REASON_CODES
} from "./decision-outcome.js";
import { DecisionAuthorNotifier } from "./author-notifier.js";
import { DecisionImmutabilityGuard, DecisionFinalizedError } from "./immutability-guard.js";
import type { FinalDecisionRepository } from "./ports.js";
import { FinalDecisionConflictError } from "../../data/final-decision/final-decision.repository.js";

export type PostFinalDecisionOutcome =
  | {
      outcome: "DECISION_RECORDED";
      statusCode: 200;
      outcomeCode: "DECISION_RECORDED";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
      decidedAt: string;
      notificationStatus: "NOTIFIED" | "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      outcome: "REVIEWS_PENDING";
      statusCode: 409;
      outcomeCode: "REVIEWS_PENDING";
      message: string;
      completedReviewCount: number;
      requiredReviewCount: number;
    }
  | {
      outcome: "DECISION_FINALIZED";
      statusCode: 409;
      outcomeCode: "DECISION_FINALIZED";
      message: string;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 403 | 404;
      outcomeCode: "UNAVAILABLE_DENIED";
      message: string;
    };

interface PostFinalDecisionServiceDeps {
  repository: Pick<
    FinalDecisionRepository,
    "withPaperDecisionLock" | "getDecisionCompletionStatus" | "getFinalDecision" | "recordFinalDecision"
  >;
  completionGate: DecisionCompletionGate;
  immutabilityGuard: DecisionImmutabilityGuard;
  auditLogger: DecisionAuditLogger;
  authorNotifier: DecisionAuthorNotifier;
}

export class PostFinalDecisionService {
  constructor(private readonly deps: PostFinalDecisionServiceDeps) {}

  async execute(input: {
    editorUserId: string;
    paperId: string;
    decision: "ACCEPT" | "REJECT";
    requestId: string;
  }): Promise<PostFinalDecisionOutcome> {
    return this.deps.repository.withPaperDecisionLock(input.paperId, async () => {
      let completionStatus: Awaited<ReturnType<FinalDecisionRepository["getDecisionCompletionStatus"]>> = null;

      try {
        completionStatus = await this.deps.repository.getDecisionCompletionStatus(
          input.paperId,
          input.editorUserId
        );
      } catch {
        completionStatus = null;
      }

      if (!completionStatus) {
        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          reasonCode: FINAL_DECISION_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
          metadata: { requestId: input.requestId }
        });

        return {
          outcome: "UNAVAILABLE_DENIED",
          statusCode: 404,
          outcomeCode: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Final decision is unavailable for this paper."
        };
      }

      const existingDecision = await this.deps.repository.getFinalDecision(input.paperId);

      try {
        this.deps.immutabilityGuard.ensureNotFinalized(existingDecision);
      } catch (error) {
        if (error instanceof DecisionFinalizedError) {
          await this.deps.auditLogger.record({
            actorUserId: input.editorUserId,
            paperId: input.paperId,
            outcome: FINAL_DECISION_OUTCOMES.DECISION_FINALIZED,
            reasonCode: FINAL_DECISION_REASON_CODES.DECISION_ALREADY_FINALIZED,
            metadata: {
              requestId: input.requestId,
              existingDecision: existingDecision?.decision
            }
          });

          return {
            outcome: "DECISION_FINALIZED",
            statusCode: 409,
            outcomeCode: "DECISION_FINALIZED",
            message: "A final decision has already been recorded for this paper."
          };
        }

        throw error;
      }

      const gateDecision = this.deps.completionGate.evaluate(completionStatus);

      if (!gateDecision.allowed) {
        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: FINAL_DECISION_OUTCOMES.REVIEWS_PENDING,
          reasonCode: FINAL_DECISION_REASON_CODES.PENDING_REQUIRED_REVIEWS,
          metadata: {
            requestId: input.requestId,
            completedReviewCount: gateDecision.status.completedReviewCount,
            requiredReviewCount: gateDecision.status.requiredReviewCount,
            requestPayload: { decision: input.decision }
          }
        });

        return {
          outcome: "REVIEWS_PENDING",
          statusCode: 409,
          outcomeCode: FINAL_DECISION_OUTCOMES.REVIEWS_PENDING,
          message: "A final decision cannot be made yet because required reviews are still pending.",
          completedReviewCount: gateDecision.status.completedReviewCount,
          requiredReviewCount: gateDecision.status.requiredReviewCount
        };
      }

      try {
        const recorded = await this.deps.repository.recordFinalDecision({
          paperId: input.paperId,
          decision: input.decision,
          decidedByEditorId: input.editorUserId
        });

        const notificationResult = await this.deps.authorNotifier.notifyAuthor({
          authorUserId: completionStatus.authorUserId,
          paperId: input.paperId,
          decision: input.decision,
          decidedAt: recorded.decidedAt.toISOString()
        });

        const message =
          notificationResult === "NOTIFIED"
            ? "Final decision recorded and author notified."
            : "Decision recorded. Author notification failed and must be retried.";

        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: FINAL_DECISION_OUTCOMES.DECISION_RECORDED,
          reasonCode:
            notificationResult === "NOTIFIED"
              ? FINAL_DECISION_REASON_CODES.NOTIFIED
              : FINAL_DECISION_REASON_CODES.NOTIFICATION_FAILED,
          metadata: {
            requestId: input.requestId,
            decision: input.decision,
            requestPayload: { decision: input.decision },
            notificationStatus: notificationResult,
            authorUserId: completionStatus.authorUserId
          }
        });

        return {
          outcome: "DECISION_RECORDED",
          statusCode: 200,
          outcomeCode: FINAL_DECISION_OUTCOMES.DECISION_RECORDED,
          paperId: input.paperId,
          decision: recorded.decision,
          decidedAt: recorded.decidedAt.toISOString(),
          notificationStatus: notificationResult,
          message
        };
      } catch (error) {
        if (error instanceof FinalDecisionConflictError || error instanceof DecisionFinalizedError) {
          await this.deps.auditLogger.record({
            actorUserId: input.editorUserId,
            paperId: input.paperId,
            outcome: FINAL_DECISION_OUTCOMES.DECISION_FINALIZED,
            reasonCode: FINAL_DECISION_REASON_CODES.DECISION_ALREADY_FINALIZED,
            metadata: {
              requestId: input.requestId,
              requestPayload: { decision: input.decision },
              errorName: error.name
            }
          });

          return {
            outcome: "DECISION_FINALIZED",
            statusCode: 409,
            outcomeCode: "DECISION_FINALIZED",
            message: "A final decision has already been recorded for this paper."
          };
        }

        await this.deps.auditLogger.record({
          actorUserId: input.editorUserId,
          paperId: input.paperId,
          outcome: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          reasonCode: FINAL_DECISION_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
          metadata: {
            requestId: input.requestId,
            errorName: error instanceof Error ? error.name : "UnknownError"
          }
        });

        return {
          outcome: "UNAVAILABLE_DENIED",
          statusCode: 403,
          outcomeCode: FINAL_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
          message: "Final decision is unavailable for this paper."
        };
      }
    });
  }
}
