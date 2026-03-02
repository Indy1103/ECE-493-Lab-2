import { AssignmentAuthorizationValidator } from "./assignmentAuthorization.js";
import type { AssignedPaperAuditRepository } from "../../data/referee-access/assignedPaperAuditRepository.js";
import type {
  AssignedPaperRepository,
  RefereeAssignmentListItem
} from "../../data/referee-access/assignedPaperRepository.js";
import { REFEREE_ACCESS_OUTCOMES } from "../../shared/accessOutcomes.js";

export type AccessAssignedPaperOutcome =
  | {
      outcome: "ACCESS_GRANTED";
      messageCode: "ACCESS_GRANTED";
      paper: {
        paperId: string;
        title: string;
        contentUrl: string;
      };
      reviewForm: {
        reviewFormId: string;
        schemaVersion: string;
        formUrl: string;
      };
    }
  | {
      outcome: "UNAVAILABLE";
      messageCode: "UNAVAILABLE";
      message: string;
      items: Array<{
        assignmentId: string;
        paperId: string;
        title: string;
        availability: "AVAILABLE" | "UNAVAILABLE";
      }>;
    }
  | {
      outcome: "UNAVAILABLE_OR_NOT_FOUND";
      messageCode: "UNAVAILABLE_OR_NOT_FOUND";
      message: string;
    }
  | {
      outcome: "INTERNAL_ERROR";
      messageCode: "INTERNAL_ERROR";
      message: string;
    };

interface AccessAssignedPaperServiceDeps {
  repository: Pick<
    AssignedPaperRepository,
    | "listAssignmentsForReferee"
    | "getAssignmentById"
    | "getPaperAccessResource"
    | "getReviewFormAccess"
  >;
  auditRepository: Pick<AssignedPaperAuditRepository, "record">;
  authorizationValidator: AssignmentAuthorizationValidator;
}

function toSummary(item: RefereeAssignmentListItem): {
  assignmentId: string;
  paperId: string;
  title: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
} {
  return {
    assignmentId: item.assignmentId,
    paperId: item.paperId,
    title: item.title,
    availability: item.availability
  };
}

export class AccessAssignedPaperService {
  constructor(private readonly deps: AccessAssignedPaperServiceDeps) {}

  private async buildUpdatedList(refereeUserId: string) {
    const rawItems = await this.deps.repository.listAssignmentsForReferee(refereeUserId);
    return rawItems
      .filter((item) => this.deps.authorizationValidator.isListVisible(item))
      .map(toSummary);
  }

  async execute(input: {
    refereeUserId: string;
    assignmentId: string;
    requestId: string;
  }): Promise<AccessAssignedPaperOutcome> {
    try {
      const assignment = await this.deps.repository.getAssignmentById(input.assignmentId);
      const authorization = this.deps.authorizationValidator.evaluateDirectAccess(
        assignment,
        input.refereeUserId
      );

      if (!authorization.authorized) {
        if (authorization.outcome === "UNAVAILABLE_OR_NOT_FOUND") {
          await this.deps.auditRepository.record({
            actorUserId: input.refereeUserId,
            assignmentId: input.assignmentId,
            outcome: "UNAVAILABLE_OR_NOT_FOUND",
            reasonCode: authorization.reasonCode
          });

          return {
            outcome: "UNAVAILABLE_OR_NOT_FOUND",
            messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE_OR_NOT_FOUND,
            message: "The selected paper is unavailable."
          };
        }

        const refreshed = await this.buildUpdatedList(input.refereeUserId);
        await this.deps.auditRepository.record({
          actorUserId: input.refereeUserId,
          assignmentId: input.assignmentId,
          paperId: assignment?.paperId ?? null,
          outcome: "UNAVAILABLE",
          reasonCode: authorization.reasonCode
        });

        return {
          outcome: "UNAVAILABLE",
          messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE,
          message: "The selected paper is no longer available for review.",
          items: refreshed
        };
      }

      if (!assignment) {
        return {
          outcome: "UNAVAILABLE_OR_NOT_FOUND",
          messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE_OR_NOT_FOUND,
          message: "The selected paper is unavailable."
        };
      }

      const [paper, reviewForm] = await Promise.all([
        this.deps.repository.getPaperAccessResource(assignment.paperId),
        this.deps.repository.getReviewFormAccess(assignment.reviewFormId)
      ]);

      if (!paper || paper.availability !== "AVAILABLE") {
        const refreshed = await this.buildUpdatedList(input.refereeUserId);
        await this.deps.auditRepository.record({
          actorUserId: input.refereeUserId,
          assignmentId: assignment.id,
          paperId: assignment.paperId,
          outcome: "UNAVAILABLE",
          reasonCode: "PAPER_UNAVAILABLE"
        });

        return {
          outcome: "UNAVAILABLE",
          messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE,
          message: "The selected paper is no longer available for review.",
          items: refreshed
        };
      }

      if (!reviewForm || reviewForm.status !== "READY") {
        const refreshed = await this.buildUpdatedList(input.refereeUserId);
        await this.deps.auditRepository.record({
          actorUserId: input.refereeUserId,
          assignmentId: assignment.id,
          paperId: assignment.paperId,
          outcome: "FORM_UNAVAILABLE",
          reasonCode: "REVIEW_FORM_UNAVAILABLE"
        });

        return {
          outcome: "UNAVAILABLE",
          messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE,
          message: "The selected paper is no longer available for review.",
          items: refreshed
        };
      }

      await this.deps.auditRepository.record({
        actorUserId: input.refereeUserId,
        assignmentId: assignment.id,
        paperId: assignment.paperId,
        outcome: "SUCCESS",
        reasonCode: REFEREE_ACCESS_OUTCOMES.ACCESS_GRANTED
      });

      return {
        outcome: "ACCESS_GRANTED",
        messageCode: REFEREE_ACCESS_OUTCOMES.ACCESS_GRANTED,
        paper: {
          paperId: paper.paperId,
          title: paper.title,
          contentUrl: paper.contentUrl
        },
        reviewForm: {
          reviewFormId: reviewForm.reviewFormId,
          schemaVersion: reviewForm.schemaVersion,
          formUrl: reviewForm.formUrl
        }
      };
    } catch {
      return {
        outcome: "INTERNAL_ERROR",
        messageCode: REFEREE_ACCESS_OUTCOMES.INTERNAL_ERROR,
        message: "Assigned paper access failed unexpectedly."
      };
    }
  }
}
