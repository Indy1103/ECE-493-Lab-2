export class PasswordChangeValidationError extends Error {
  constructor(
    public readonly violations: Array<{ field: string; rule: string; message: string }>
  ) {
    super("Password change validation failed");
    this.name = "PasswordChangeValidationError";
  }
}

export class PasswordChangeUnauthorizedError extends Error {
  constructor(message = "Session is invalid or expired.") {
    super(message);
    this.name = "PasswordChangeUnauthorizedError";
  }
}

export class PasswordChangeThrottledError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Too many failed password change attempts. Please try again later.");
    this.name = "PasswordChangeThrottledError";
  }
}

export class PasswordChangeConflictError extends Error {
  constructor(message = "Password change conflicted with another update.") {
    super(message);
    this.name = "PasswordChangeConflictError";
  }
}

export class PasswordChangeOperationalError extends Error {
  constructor(message = "Password change is temporarily unavailable. Please try again.") {
    super(message);
    this.name = "PasswordChangeOperationalError";
  }
}
