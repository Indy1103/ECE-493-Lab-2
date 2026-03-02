import type { ScheduleEditEntryInput } from "../validation/scheduleEditSchema.js";

export interface EditableScheduleEntry {
  paperId: string;
  sessionId: string;
  roomId: string;
  timeSlotId: string;
}

export interface ScheduleReferenceCatalog {
  sessionIds: Set<string>;
  roomIds: Set<string>;
  timeSlotIds: Set<string>;
}

export interface ScheduleValidationViolation {
  field: "paperId" | "sessionId" | "roomId" | "timeSlotId";
  message: string;
  value: string;
}

export function validateScheduleEdits(input: {
  existingEntries: EditableScheduleEntry[];
  requestedEntries: ScheduleEditEntryInput[];
  references: ScheduleReferenceCatalog;
}): ScheduleValidationViolation[] {
  const existingPaperIds = new Set(input.existingEntries.map((entry) => entry.paperId));
  const violations: ScheduleValidationViolation[] = [];

  for (const entry of input.requestedEntries) {
    if (!existingPaperIds.has(entry.paperId)) {
      violations.push({
        field: "paperId",
        value: entry.paperId,
        message: "Referenced paper is not in the current schedule."
      });
    }

    if (!input.references.sessionIds.has(entry.sessionId)) {
      violations.push({
        field: "sessionId",
        value: entry.sessionId,
        message: "Referenced session does not exist."
      });
    }

    if (!input.references.roomIds.has(entry.roomId)) {
      violations.push({
        field: "roomId",
        value: entry.roomId,
        message: "Referenced room does not exist."
      });
    }

    if (!input.references.timeSlotIds.has(entry.timeSlotId)) {
      violations.push({
        field: "timeSlotId",
        value: entry.timeSlotId,
        message: "Referenced time slot does not exist."
      });
    }
  }

  return violations;
}
