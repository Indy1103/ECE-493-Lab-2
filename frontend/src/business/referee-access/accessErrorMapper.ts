export type RefereeAccessErrorCode =
  | "SESSION_EXPIRED"
  | "UNAVAILABLE"
  | "UNAVAILABLE_OR_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "TLS_REQUIRED";

export function mapRefereeAccessError(code: RefereeAccessErrorCode): string {
  switch (code) {
    case "SESSION_EXPIRED":
      return "Your session has expired. Please sign in again.";
    case "UNAVAILABLE":
      return "The selected paper is no longer available for review.";
    case "UNAVAILABLE_OR_NOT_FOUND":
      return "The selected paper is unavailable.";
    case "TLS_REQUIRED":
      return "HTTPS is required for assigned paper access.";
    case "INTERNAL_ERROR":
    default:
      return "Assigned paper access failed unexpectedly.";
  }
}
