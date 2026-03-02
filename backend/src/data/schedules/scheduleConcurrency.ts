import { ScheduleFinalizedError, ScheduleVersionConflictError } from "../../shared/errors/scheduleErrors.js";

export interface VersionedScheduleState {
  status: "DRAFT" | "FINAL";
  version: number;
}

export function assertScheduleCanBeUpdated(input: {
  expectedVersion: number;
  current: VersionedScheduleState;
}): void {
  if (input.current.status === "FINAL") {
    throw new ScheduleFinalizedError();
  }

  if (input.current.version !== input.expectedVersion) {
    throw new ScheduleVersionConflictError();
  }
}
