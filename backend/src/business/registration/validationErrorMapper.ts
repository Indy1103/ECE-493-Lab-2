import type { ZodIssue } from "zod";

import type { FieldValidationError } from "../../shared/contracts/registrationOutcome.js";

export function mapValidationIssues(issues: ZodIssue[]): FieldValidationError[] {
  return issues
    .map((issue) => {
      const field = issue.path[0];

      if (field === "fullName") {
        return {
          field: "fullName",
          rule: "required",
          message: "Full name is required."
        };
      }

      if (field === "email") {
        return {
          field: "email",
          rule: "email_format",
          message: "Email must be a valid address."
        };
      }

      if (field === "password") {
        return {
          field: "password",
          rule: "min_length_and_composition",
          message:
            "Password must be at least 8 characters and include at least one letter and one number."
        };
      }

      return null;
    })
    .filter((entry): entry is FieldValidationError => entry !== null);
}
