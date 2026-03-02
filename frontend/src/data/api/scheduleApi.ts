import type { ScheduleDto, ScheduleEntryDto } from "../mappers/scheduleMapper.js";

export async function getSchedule(conferenceId: string, baseUrl = ""): Promise<ScheduleDto> {
  const response = await fetch(`${baseUrl}/api/editor/conferences/${conferenceId}/schedule`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as { message?: string };
    throw new Error(errorBody.message ?? "Failed to load schedule.");
  }

  return (await response.json()) as ScheduleDto;
}

export async function updateSchedule(
  conferenceId: string,
  payload: {
    scheduleId: string;
    entries: ScheduleEntryDto[];
  },
  baseUrl = ""
): Promise<ScheduleDto> {
  const response = await fetch(`${baseUrl}/api/editor/conferences/${conferenceId}/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as { message?: string };
    throw new Error(errorBody.message ?? "Failed to update schedule.");
  }

  return (await response.json()) as ScheduleDto;
}
