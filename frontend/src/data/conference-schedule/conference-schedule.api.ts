export type ConferenceScheduleClientResult =
  | {
      status: "SCHEDULE_GENERATED";
      conferenceId: string;
      entries: Array<{
        paperId: string;
        sessionCode: string;
        roomCode: string;
        startTime: string;
        endTime: string;
      }>;
    }
  | {
      status: "NO_ACCEPTED_PAPERS";
      message: string;
    }
  | {
      status: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapErrorStatus(code: unknown):
  | "UNAVAILABLE_DENIED"
  | "SESSION_EXPIRED"
  | "TLS_REQUIRED"
  | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "UNAVAILABLE_DENIED":
    case "SESSION_EXPIRED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

export async function generateConferenceSchedule(
  conferenceId: string,
  baseUrl = ""
): Promise<ConferenceScheduleClientResult> {
  const response = await fetch(`${baseUrl}/api/admin/conference/${conferenceId}/schedule`, {
    method: "POST",
    headers: {
      Accept: "application/json"
    }
  });

  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "SCHEDULE_GENERATED",
      conferenceId: String(body.conferenceId ?? ""),
      entries: Array.isArray(body.entries)
        ? (body.entries as Array<Record<string, unknown>>).map((entry) => ({
            paperId: String(entry.paperId ?? ""),
            sessionCode: String(entry.sessionCode ?? ""),
            roomCode: String(entry.roomCode ?? ""),
            startTime: String(entry.startTime ?? ""),
            endTime: String(entry.endTime ?? "")
          }))
        : []
    };
  }

  if (response.status === 409) {
    return {
      status: "NO_ACCEPTED_PAPERS",
      message: String(body.message ?? "No accepted papers are available to schedule.")
    };
  }

  return {
    status: mapErrorStatus(body.outcome),
    message: String(body.message ?? "Conference schedule is unavailable for this conference.")
  };
}
