import type {
  RefereeAssignmentListItem,
  RefereeAssignmentRecord
} from "../../data/referee-access/assignedPaperRepository.js";

export type AssignmentAccessAuthorizationResult =
  | {
      authorized: true;
    }
  | {
      authorized: false;
      outcome: "UNAVAILABLE" | "UNAVAILABLE_OR_NOT_FOUND";
      reasonCode: string;
    };

export class AssignmentAuthorizationValidator {
  isListVisible(item: RefereeAssignmentListItem): boolean {
    if (item.invitationStatus !== "ACCEPTED") {
      return false;
    }

    return item.status !== "REVOKED";
  }

  evaluateDirectAccess(
    assignment: RefereeAssignmentRecord | null,
    refereeUserId: string
  ): AssignmentAccessAuthorizationResult {
    if (!assignment) {
      return {
        authorized: false,
        outcome: "UNAVAILABLE_OR_NOT_FOUND",
        reasonCode: "ASSIGNMENT_NOT_FOUND"
      };
    }

    if (assignment.refereeUserId !== refereeUserId) {
      return {
        authorized: false,
        outcome: "UNAVAILABLE_OR_NOT_FOUND",
        reasonCode: "ASSIGNMENT_NOT_OWNED"
      };
    }

    if (assignment.invitationStatus !== "ACCEPTED") {
      return {
        authorized: false,
        outcome: "UNAVAILABLE",
        reasonCode: "INVITATION_NOT_ACCEPTED"
      };
    }

    if (assignment.status !== "ACTIVE") {
      return {
        authorized: false,
        outcome: "UNAVAILABLE",
        reasonCode: "ASSIGNMENT_NOT_ACTIVE"
      };
    }

    return { authorized: true };
  }
}
