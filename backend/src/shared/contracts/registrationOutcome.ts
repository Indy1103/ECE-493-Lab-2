export const REGISTRATION_OUTCOMES = [
  "REGISTERED",
  "VALIDATION_FAILED",
  "DUPLICATE_EMAIL",
  "THROTTLED",
  "PROCESSING_FAILURE"
] as const;

export type RegistrationOutcomeCategory = (typeof REGISTRATION_OUTCOMES)[number];

export interface FieldValidationError {
  field: "fullName" | "email" | "password";
  rule: string;
  message: string;
}

export const REGISTRATION_FIELDS = ["fullName", "email", "password"] as const;

export type RegisterUserResult =
  | { outcome: "REGISTERED" }
  | { outcome: "VALIDATION_FAILED"; errors: FieldValidationError[] }
  | { outcome: "DUPLICATE_EMAIL" }
  | { outcome: "THROTTLED"; retryAfterSeconds: number }
  | { outcome: "PROCESSING_FAILURE" };
