export type LoginErrorStatus =
  | "INVALID_CREDENTIALS"
  | "ROLE_MAPPING_UNAVAILABLE"
  | "THROTTLED"
  | "UNAVAILABLE";

export interface LoginErrorState {
  status: LoginErrorStatus;
  message: string;
  retryAfterSeconds?: number;
}

export function mapLoginErrorState(
  httpStatus: number,
  retryAfterSeconds?: number
): LoginErrorState {
  if (httpStatus === 401) {
    return {
      status: "INVALID_CREDENTIALS",
      message: "Invalid username or password."
    };
  }

  if (httpStatus === 403) {
    return {
      status: "ROLE_MAPPING_UNAVAILABLE",
      message: "Your account cannot be routed to a role home page. Contact support."
    };
  }

  if (httpStatus === 429) {
    return {
      status: "THROTTLED",
      message: "Too many failed login attempts. Please try again later.",
      retryAfterSeconds
    };
  }

  return {
    status: "UNAVAILABLE",
    message: "Authentication is temporarily unavailable. Please try again."
  };
}
