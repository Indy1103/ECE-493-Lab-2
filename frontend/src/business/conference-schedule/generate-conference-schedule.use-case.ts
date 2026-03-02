import {
  generateConferenceSchedule,
  type ConferenceScheduleClientResult
} from "../../data/conference-schedule/conference-schedule.api.js";

export type ConferenceScheduleViewState =
  | {
      state: "GENERATED";
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
      state: "NO_ACCEPTED_PAPERS";
      message: string;
    }
  | {
      state: "ERROR";
      code: "UNAVAILABLE_DENIED" | "SESSION_EXPIRED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE";
      message: string;
    };

function mapResult(result: ConferenceScheduleClientResult): ConferenceScheduleViewState {
  if (result.status === "SCHEDULE_GENERATED") {
    return {
      state: "GENERATED",
      conferenceId: result.conferenceId,
      entries: result.entries
    };
  }

  if (result.status === "NO_ACCEPTED_PAPERS") {
    return {
      state: "NO_ACCEPTED_PAPERS",
      message: result.message
    };
  }

  return {
    state: "ERROR",
    code: result.status,
    message: result.message
  };
}

export async function generateConferenceScheduleUseCase(
  conferenceId: string,
  baseUrl = ""
): Promise<ConferenceScheduleViewState> {
  const result = await generateConferenceSchedule(conferenceId, baseUrl);
  return mapResult(result);
}
