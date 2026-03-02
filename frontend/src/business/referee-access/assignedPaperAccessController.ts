import {
  accessAssignedPaper,
  fetchAssignedPapers,
  type AccessAssignedPaperClientResult,
  type AssignedPaperSummary,
  type FetchAssignmentsClientResult
} from "../../data/referee-access/assignedPaperApiClient.js";
import { mapRefereeAccessError, type RefereeAccessErrorCode } from "./accessErrorMapper.js";

export type AssignedPaperPageState =
  | {
      state: "ASSIGNMENTS_AVAILABLE";
      items: AssignedPaperSummary[];
    }
  | {
      state: "NO_ASSIGNMENTS";
      items: AssignedPaperSummary[];
    }
  | {
      state: "ERROR";
      code: RefereeAccessErrorCode;
      message: string;
    };

export type AssignedPaperAccessState =
  | {
      state: "ACCESS_GRANTED";
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
      state: "UNAVAILABLE";
      message: string;
      items: AssignedPaperSummary[];
    }
  | {
      state: "ERROR";
      code: RefereeAccessErrorCode;
      message: string;
    };

function mapListResult(result: FetchAssignmentsClientResult): AssignedPaperPageState {
  if (result.status === "ASSIGNMENTS_AVAILABLE" || result.status === "NO_ASSIGNMENTS") {
    return {
      state: result.status,
      items: result.items
    } as AssignedPaperPageState;
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message || mapRefereeAccessError(result.status)
  };
}

function mapAccessResult(result: AccessAssignedPaperClientResult): AssignedPaperAccessState {
  if (result.status === "ACCESS_GRANTED") {
    return {
      state: "ACCESS_GRANTED",
      paper: result.paper,
      reviewForm: result.reviewForm
    };
  }

  if (result.status === "UNAVAILABLE") {
    return {
      state: "UNAVAILABLE",
      message: result.message || mapRefereeAccessError("UNAVAILABLE"),
      items: result.items
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message || mapRefereeAccessError(result.status)
  };
}

export async function loadAssignedPapers(baseUrl = ""): Promise<AssignedPaperPageState> {
  return mapListResult(await fetchAssignedPapers(baseUrl));
}

export async function requestAssignedPaperAccess(
  assignmentId: string,
  baseUrl = ""
): Promise<AssignedPaperAccessState> {
  return mapAccessResult(await accessAssignedPaper(assignmentId, baseUrl));
}
