export interface AssignmentOptionReferee {
  refereeId: string;
  displayName: string;
  currentWorkload: number;
  maxWorkload: number;
  eligible: boolean;
}

export type GetAssignmentOptionsClientResult =
  | {
      status: "SUCCESS";
      paperId: string;
      currentAssignedCount: number;
      remainingSlots: number;
      maxRefereesPerPaper: number;
      candidateReferees: AssignmentOptionReferee[];
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "PAPER_NOT_FOUND"
        | "PAPER_NOT_ASSIGNABLE"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(
  code: unknown
): Exclude<GetAssignmentOptionsClientResult, { status: "SUCCESS" }>["status"] {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "PAPER_NOT_FOUND":
    case "PAPER_NOT_ASSIGNABLE":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getAssignmentOptions(
  paperId: string,
  baseUrl = ""
): Promise<GetAssignmentOptionsClientResult> {
  const response = await fetch(`${baseUrl}/api/v1/papers/${paperId}/referee-assignment-options`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SUCCESS",
      paperId: String(body.paperId ?? ""),
      currentAssignedCount: Number(body.currentAssignedCount ?? 0),
      remainingSlots: Number(body.remainingSlots ?? 0),
      maxRefereesPerPaper: Number(body.maxRefereesPerPaper ?? 0),
      candidateReferees: Array.isArray(body.candidateReferees)
        ? (body.candidateReferees as AssignmentOptionReferee[])
        : []
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Assignment options are currently unavailable.")
  };
}
