import { getSchedule, updateSchedule } from "../../data/api/scheduleApi.js";
import type { ScheduleEntryDto } from "../../data/mappers/scheduleMapper.js";
import { mapScheduleToEditorState } from "../../data/mappers/scheduleMapper.js";

export async function loadEditableSchedule(conferenceId: string, baseUrl = "") {
  const schedule = await getSchedule(conferenceId, baseUrl);
  return mapScheduleToEditorState(schedule);
}

export function validateClientSideEntries(entries: ScheduleEntryDto[]): string[] {
  const errors: string[] = [];

  entries.forEach((entry, index) => {
    if (!entry.paperId || !entry.sessionId || !entry.roomId || !entry.timeSlotId) {
      errors.push(`Entry ${index + 1} is missing required references.`);
    }
  });

  return errors;
}

export async function submitEditableSchedule(
  conferenceId: string,
  payload: {
    scheduleId: string;
    entries: ScheduleEntryDto[];
  },
  baseUrl = ""
) {
  const clientErrors = validateClientSideEntries(payload.entries);
  if (clientErrors.length > 0) {
    return {
      ok: false as const,
      errors: clientErrors
    };
  }

  const schedule = await updateSchedule(conferenceId, payload, baseUrl);

  return {
    ok: true as const,
    schedule: mapScheduleToEditorState(schedule)
  };
}
