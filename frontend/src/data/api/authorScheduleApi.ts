export interface AuthorScheduleEntry {
  paperId: string;
  sessionId: string;
  roomId: string;
  timeSlotId: string;
}

export interface AuthorPresentationDetail {
  paperId: string;
  roomId: string;
  timeSlotId: string;
}

export type AuthorScheduleApiResult =
  | {
      status: "SCHEDULE_AVAILABLE";
      schedule: {
        id: string;
        conferenceId: string;
        status: "DRAFT" | "FINAL";
        entries: AuthorScheduleEntry[];
        authorPresentations: AuthorPresentationDetail[];
      };
    }
  | {
      status:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "UNAVAILABLE_DENIED"
        | "SCHEDULE_NOT_PUBLISHED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(code: unknown):
  | "AUTHENTICATION_REQUIRED"
  | "AUTHORIZATION_FAILED"
  | "UNAVAILABLE_DENIED"
  | "SCHEDULE_NOT_PUBLISHED"
  | "TLS_REQUIRED"
  | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "UNAVAILABLE_DENIED":
    case "SCHEDULE_NOT_PUBLISHED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function getAuthorSchedule(baseUrl = ""): Promise<AuthorScheduleApiResult> {
  const response = await fetch(`${baseUrl}/api/author/schedule`, {
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SCHEDULE_AVAILABLE",
      schedule: {
        id: String(body.id ?? ""),
        conferenceId: String(body.conferenceId ?? ""),
        status: body.status === "DRAFT" ? "DRAFT" : "FINAL",
        entries: Array.isArray(body.entries) ? (body.entries as AuthorScheduleEntry[]) : [],
        authorPresentations: Array.isArray(body.authorPresentations)
          ? (body.authorPresentations as AuthorPresentationDetail[])
          : []
      }
    };
  }

  return {
    status: mapErrorStatus(body.code),
    message: String(body.message ?? "Final schedule is unavailable for this account.")
  };
}
