export class ManuscriptValidationError extends Error {
  constructor(public readonly violations: Array<{ field: string; rule: string; message: string }>) {
    super("Manuscript submission validation failed.");
    this.name = "ManuscriptValidationError";
  }
}

export class ManuscriptAuthorizationError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "ManuscriptAuthorizationError";
  }
}

export class ManuscriptIntakeClosedError extends Error {
  constructor(message = "Submission intake is currently closed.") {
    super(message);
    this.name = "ManuscriptIntakeClosedError";
  }
}

export class ManuscriptDuplicateError extends Error {
  constructor(message = "A matching active submission already exists.") {
    super(message);
    this.name = "ManuscriptDuplicateError";
  }
}

export class ManuscriptOperationalError extends Error {
  constructor(message = "Submission could not be completed. Please retry.") {
    super(message);
    this.name = "ManuscriptOperationalError";
  }
}
