import type { AuthorScheduleApiResult } from "../api/authorScheduleApi.js";

export type AuthorScheduleViewState =
  | {
      state: "VISIBLE";
      schedule: {
        id: string;
        conferenceId: string;
        status: "DRAFT" | "FINAL";
        entries: Array<{
          paperId: string;
          sessionId: string;
          roomId: string;
          timeSlotId: string;
        }>;
        authorPresentations: Array<{
          paperId: string;
          roomId: string;
          timeSlotId: string;
        }>;
      };
    }
  | {
      state: "UNPUBLISHED";
      message: string;
    }
  | {
      state: "ERROR";
      code:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "UNAVAILABLE_DENIED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

export function mapAuthorScheduleResultToViewState(
  result: AuthorScheduleApiResult
): AuthorScheduleViewState {
  if (result.status === "SCHEDULE_AVAILABLE") {
    return {
      state: "VISIBLE",
      schedule: {
        id: result.schedule.id,
        conferenceId: result.schedule.conferenceId,
        status: result.schedule.status,
        entries: result.schedule.entries.map((entry) => ({ ...entry })),
        authorPresentations: result.schedule.authorPresentations.map((entry) => ({ ...entry }))
      }
    };
  }

  if (result.status === "SCHEDULE_NOT_PUBLISHED") {
    return {
      state: "UNPUBLISHED",
      message: result.message
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}
