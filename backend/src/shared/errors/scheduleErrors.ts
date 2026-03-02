export const SCHEDULE_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  AUTHORIZATION_FAILED: "AUTHORIZATION_FAILED",
  UNAVAILABLE_DENIED: "UNAVAILABLE_DENIED",
  INVALID_MODIFICATIONS: "INVALID_MODIFICATIONS",
  SCHEDULE_ALREADY_FINAL: "SCHEDULE_ALREADY_FINAL",
  CONFLICT: "CONFLICT",
  TLS_REQUIRED: "TLS_REQUIRED"
} as const;

export type ScheduleErrorCode = (typeof SCHEDULE_ERROR_CODES)[keyof typeof SCHEDULE_ERROR_CODES];

export class ScheduleVersionConflictError extends Error {
  constructor(message = "Schedule update conflict") {
    super(message);
    this.name = "ScheduleVersionConflictError";
  }
}

export class ScheduleFinalizedError extends Error {
  constructor(message = "Schedule is already final") {
    super(message);
    this.name = "ScheduleFinalizedError";
  }
}
