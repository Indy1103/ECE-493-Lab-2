import { AuthorDecisionAuditLogger } from "./audit-logger.js";
import {
  AUTHOR_DECISION_OUTCOMES,
  AUTHOR_DECISION_REASON_CODES
} from "./decision-outcome.js";
import { AuthorDecisionNotificationStatusReader } from "./notification-status.js";
import { AuthorDecisionOwnershipCheck } from "./ownership-check.js";
import type { AuthorDecisionRepository } from "./ports.js";

export type GetAuthorDecisionOutcome =
  | {
      outcome: "DECISION_AVAILABLE";
      statusCode: 200;
      outcomeCode: "DECISION_AVAILABLE";
      paperId: string;
      decision: "ACCEPT" | "REJECT";
    }
  | {
      outcome: "NOTIFICATION_FAILED";
      statusCode: 409;
      outcomeCode: "NOTIFICATION_FAILED";
      message: string;
    }
  | {
      outcome: "UNAVAILABLE_DENIED";
      statusCode: 403 | 404;
      outcomeCode: "UNAVAILABLE_DENIED";
      message: string;
    };

interface GetAuthorDecisionServiceDeps {
  repository: Pick<AuthorDecisionRepository, "getAuthorDecision">;
  ownershipCheck: AuthorDecisionOwnershipCheck;
  notificationStatusReader: AuthorDecisionNotificationStatusReader;
  auditLogger: AuthorDecisionAuditLogger;
}

export class GetAuthorDecisionService {
  constructor(private readonly deps: GetAuthorDecisionServiceDeps) {}

  async execute(input: {
    authorUserId: string;
    paperId: string;
    requestId: string;
  }): Promise<GetAuthorDecisionOutcome> {
    const record = await this.deps.repository.getAuthorDecision(input.paperId, input.authorUserId);

    if (!record || !this.deps.ownershipCheck.isOwner(record, input.authorUserId)) {
      await this.deps.auditLogger.record({
        actorUserId: input.authorUserId,
        paperId: input.paperId,
        outcome: AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
        reasonCode: AUTHOR_DECISION_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
        metadata: { requestId: input.requestId }
      });

      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        outcomeCode: "UNAVAILABLE_DENIED",
        message: "Decision is unavailable for this paper."
      };
    }

    const status = this.deps.notificationStatusReader.evaluate(record);

    if (!status.available) {
      await this.deps.auditLogger.record({
        actorUserId: input.authorUserId,
        paperId: input.paperId,
        outcome: AUTHOR_DECISION_OUTCOMES.NOTIFICATION_FAILED,
        reasonCode: AUTHOR_DECISION_REASON_CODES.NOTIFICATION_UNDELIVERED,
        metadata: {
          requestId: input.requestId,
          authorId: input.authorUserId,
          decision: record.decision
        }
      });

      return {
        outcome: "NOTIFICATION_FAILED",
        statusCode: 409,
        outcomeCode: "NOTIFICATION_FAILED",
        message: "Decision notification failed. Please check again later."
      };
    }

    await this.deps.auditLogger.record({
      actorUserId: input.authorUserId,
      paperId: input.paperId,
      outcome: AUTHOR_DECISION_OUTCOMES.DECISION_AVAILABLE,
      reasonCode: AUTHOR_DECISION_REASON_CODES.DECISION_VISIBLE,
      metadata: {
        requestId: input.requestId,
        authorId: input.authorUserId,
        decision: record.decision
      }
    });

    return {
      outcome: "DECISION_AVAILABLE",
      statusCode: 200,
      outcomeCode: "DECISION_AVAILABLE",
      paperId: input.paperId,
      decision: status.decision
    };
  }
}
