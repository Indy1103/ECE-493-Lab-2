import {
  postRefereeAssignments,
  type PostRefereeAssignmentsClientResult
} from "../../data/referee-assignments/postRefereeAssignmentsClient.js";

export type AssignRefereesActionState =
  | {
      state: "SUCCESS";
      paperId: string;
      assignedRefereeIds: string[];
      invitationStatuses: Array<{ refereeId: string; status: "SENT" | "PENDING_RETRY" }>;
      message: string;
    }
  | {
      state: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ rule: string; message: string; refereeId?: string }>;
    }
  | {
      state:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "PAPER_NOT_FOUND"
        | "PAPER_NOT_ASSIGNABLE"
        | "ASSIGNMENT_CONFLICT"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapClientResult(result: PostRefereeAssignmentsClientResult): AssignRefereesActionState {
  if (result.status === "SUCCESS") {
    return {
      state: "SUCCESS",
      paperId: result.paperId,
      assignedRefereeIds: result.assignedRefereeIds,
      invitationStatuses: result.invitationStatuses,
      message: result.message
    };
  }

  if (result.status === "VALIDATION_FAILED") {
    return {
      state: "VALIDATION_FAILED",
      message: result.message,
      violations: result.violations
    };
  }

  return {
    state: result.status,
    message: result.message
  };
}

export async function assignRefereesAction(
  paperId: string,
  refereeIds: string[],
  baseUrl = ""
): Promise<AssignRefereesActionState> {
  const result = await postRefereeAssignments(
    paperId,
    {
      refereeIds
    },
    baseUrl
  );

  return mapClientResult(result);
}
