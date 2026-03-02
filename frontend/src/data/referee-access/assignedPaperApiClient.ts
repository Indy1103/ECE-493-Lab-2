export interface AssignedPaperSummary {
  assignmentId: string;
  paperId: string;
  title: string;
  availability: "AVAILABLE" | "UNAVAILABLE";
}

export type FetchAssignmentsClientResult =
  | {
      status: "ASSIGNMENTS_AVAILABLE";
      items: AssignedPaperSummary[];
    }
  | {
      status: "NO_ASSIGNMENTS";
      items: [];
    }
  | {
      status:
        | "SESSION_EXPIRED"
        | "UNAVAILABLE"
        | "UNAVAILABLE_OR_NOT_FOUND"
        | "INTERNAL_ERROR"
        | "TLS_REQUIRED";
      message: string;
    };

export type AccessAssignedPaperClientResult =
  | {
      status: "ACCESS_GRANTED";
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
      status: "UNAVAILABLE";
      message: string;
      items: AssignedPaperSummary[];
    }
  | {
      status:
        | "SESSION_EXPIRED"
        | "UNAVAILABLE_OR_NOT_FOUND"
        | "INTERNAL_ERROR"
        | "TLS_REQUIRED";
      message: string;
    };

function parseAssignmentSummary(raw: unknown): AssignedPaperSummary {
  const value = raw as Record<string, unknown>;
  return {
    assignmentId: String(value.assignmentId ?? ""),
    paperId: String(value.paperId ?? ""),
    title: String(value.title ?? ""),
    availability: value.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE"
  };
}

function mapErrorCode(code: unknown) {
  switch (code) {
    case "SESSION_EXPIRED":
    case "UNAVAILABLE":
    case "UNAVAILABLE_OR_NOT_FOUND":
    case "INTERNAL_ERROR":
    case "TLS_REQUIRED":
      return code;
    default:
      return "INTERNAL_ERROR";
  }
}

function mapAccessErrorCode(
  code: unknown
): Exclude<AccessAssignedPaperClientResult, { status: "ACCESS_GRANTED" | "UNAVAILABLE" }>["status"] {
  switch (code) {
    case "SESSION_EXPIRED":
    case "UNAVAILABLE_OR_NOT_FOUND":
    case "INTERNAL_ERROR":
    case "TLS_REQUIRED":
      return code;
    default:
      return "INTERNAL_ERROR";
  }
}

export async function fetchAssignedPapers(baseUrl = ""): Promise<FetchAssignmentsClientResult> {
  const response = await fetch(`${baseUrl}/api/referee/assignments`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  const body = (await response.json()) as Record<string, unknown>;
  const messageCode = body.messageCode;

  if (response.status === 200 && (messageCode === "ASSIGNMENTS_AVAILABLE" || messageCode === "NO_ASSIGNMENTS")) {
    return {
      status: messageCode,
      items: Array.isArray(body.items) ? body.items.map(parseAssignmentSummary) : []
    } as FetchAssignmentsClientResult;
  }

  return {
    status: mapErrorCode(messageCode),
    message: String(body.message ?? "Assigned papers are temporarily unavailable.")
  };
}

export async function accessAssignedPaper(
  assignmentId: string,
  baseUrl = ""
): Promise<AccessAssignedPaperClientResult> {
  const response = await fetch(`${baseUrl}/api/referee/assignments/${assignmentId}/access`, {
    method: "POST",
    headers: { Accept: "application/json" }
  });

  const body = (await response.json()) as Record<string, unknown>;
  const messageCode = body.messageCode;

  if (response.status === 200 && messageCode === "ACCESS_GRANTED") {
    const paper = (body.paper ?? {}) as Record<string, unknown>;
    const reviewForm = (body.reviewForm ?? {}) as Record<string, unknown>;
    return {
      status: "ACCESS_GRANTED",
      paper: {
        paperId: String(paper.paperId ?? ""),
        title: String(paper.title ?? ""),
        contentUrl: String(paper.contentUrl ?? "")
      },
      reviewForm: {
        reviewFormId: String(reviewForm.reviewFormId ?? ""),
        schemaVersion: String(reviewForm.schemaVersion ?? ""),
        formUrl: String(reviewForm.formUrl ?? "")
      }
    };
  }

  if (messageCode === "UNAVAILABLE") {
    return {
      status: "UNAVAILABLE",
      message: String(body.message ?? "The selected paper is no longer available for review."),
      items: Array.isArray(body.items) ? body.items.map(parseAssignmentSummary) : []
    };
  }

  return {
    status: mapAccessErrorCode(messageCode),
    message: String(body.message ?? "Assigned paper access failed unexpectedly.")
  };
}
