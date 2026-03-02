import type { ReviewFieldRule } from "./ports.js";

export interface ValidationIssue {
  fieldId: string;
  issue: string;
}

function isMissingRequired(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return true;
  }

  return false;
}

function evaluateConstraint(fieldId: string, value: unknown, constraint: string): ValidationIssue | null {
  if (constraint === "non-empty-string") {
    if (typeof value !== "string" || value.trim().length === 0) {
      return {
        fieldId,
        issue: "Value must be a non-empty string."
      };
    }
    return null;
  }

  if (constraint.startsWith("maxLength:")) {
    const maxLength = Number(constraint.slice("maxLength:".length));
    if (Number.isNaN(maxLength) || typeof value !== "string" || value.length > maxLength) {
      return {
        fieldId,
        issue: `Value must be at most ${maxLength} characters.`
      };
    }
    return null;
  }

  if (constraint.startsWith("number:")) {
    const [minRaw, maxRaw] = constraint.slice("number:".length).split("-");
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (typeof value !== "number" || Number.isNaN(min) || Number.isNaN(max) || value < min || value > max) {
      return {
        fieldId,
        issue: `Value must be a number between ${min} and ${max}.`
      };
    }
    return null;
  }

  return null;
}

export class ReviewValidationPolicy {
  validateSubmission(
    payload: { responses?: unknown },
    fields: ReviewFieldRule[]
  ): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];
    const responses =
      payload.responses && typeof payload.responses === "object"
        ? (payload.responses as Record<string, unknown>)
        : {};

    for (const field of fields) {
      const value = responses[field.fieldId];

      if (field.required && isMissingRequired(value)) {
        issues.push({
          fieldId: field.fieldId,
          issue: "This field is required."
        });
        continue;
      }

      if (value === null || value === undefined) {
        continue;
      }

      for (const constraint of field.constraints ?? []) {
        const violation = evaluateConstraint(field.fieldId, value, constraint);
        if (violation) {
          issues.push(violation);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
