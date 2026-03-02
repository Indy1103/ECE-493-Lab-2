import { AssignmentAuthorizationValidator } from "./assignmentAuthorization.js";
import type { AssignedPaperAuditRepository } from "../../data/referee-access/assignedPaperAuditRepository.js";
import type {
  AssignedPaperRepository,
  RefereeAssignmentListItem
} from "../../data/referee-access/assignedPaperRepository.js";
import { REFEREE_ACCESS_OUTCOMES } from "../../shared/accessOutcomes.js";

export type ListAssignmentsOutcome =
  | {
      outcome: "ASSIGNMENTS_AVAILABLE";
      messageCode: "ASSIGNMENTS_AVAILABLE";
      items: Array<{
        assignmentId: string;
        paperId: string;
        title: string;
        availability: "AVAILABLE" | "UNAVAILABLE";
      }>;
    }
  | {
      outcome: "NO_ASSIGNMENTS";
      messageCode: "NO_ASSIGNMENTS";
      items: [];
    }
  | {
      outcome: "INTERNAL_ERROR";
      messageCode: "INTERNAL_ERROR";
      message: string;
    };

interface ListAssignmentsServiceDeps {
  repository: Pick<AssignedPaperRepository, "listAssignmentsForReferee">;
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

export class ListAssignmentsService {
  constructor(private readonly deps: ListAssignmentsServiceDeps) {}

  async execute(input: {
    refereeUserId: string;
    requestId: string;
  }): Promise<ListAssignmentsOutcome> {
    try {
      const rawItems = await this.deps.repository.listAssignmentsForReferee(input.refereeUserId);
      const visibleItems = rawItems
        .filter((item) => this.deps.authorizationValidator.isListVisible(item))
        .map(toSummary);

      if (visibleItems.length === 0) {
        await this.deps.auditRepository.record({
          actorUserId: input.refereeUserId,
          outcome: "NO_ASSIGNMENTS",
          reasonCode: REFEREE_ACCESS_OUTCOMES.NO_ASSIGNMENTS
        });

        return {
          outcome: "NO_ASSIGNMENTS",
          messageCode: REFEREE_ACCESS_OUTCOMES.NO_ASSIGNMENTS,
          items: []
        };
      }

      return {
        outcome: "ASSIGNMENTS_AVAILABLE",
        messageCode: REFEREE_ACCESS_OUTCOMES.ASSIGNMENTS_AVAILABLE,
        items: visibleItems
      };
    } catch {
      return {
        outcome: "INTERNAL_ERROR",
        messageCode: REFEREE_ACCESS_OUTCOMES.INTERNAL_ERROR,
        message: "Assigned papers are temporarily unavailable."
      };
    }
  }
}
