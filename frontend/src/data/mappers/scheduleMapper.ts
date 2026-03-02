export interface ScheduleEntryDto {
  paperId: string;
  sessionId: string;
  roomId: string;
  timeSlotId: string;
}

export interface ScheduleDto {
  id: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: ScheduleEntryDto[];
}

export function mapScheduleToEditorState(schedule: ScheduleDto): {
  scheduleId: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: ScheduleEntryDto[];
} {
  return {
    scheduleId: schedule.id,
    conferenceId: schedule.conferenceId,
    status: schedule.status,
    entries: schedule.entries.map((entry) => ({ ...entry }))
  };
}
