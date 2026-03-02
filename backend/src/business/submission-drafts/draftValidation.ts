import { z } from "zod";

export interface DraftValidationViolation {
  field: string;
  rule: string;
  message: string;
}

export interface ValidatedDraftInput {
  title: string;
  draftPayload: Record<string, unknown>;
}

const DraftRequestSchema = z
  .object({
    title: z.string(),
    draftPayload: z.record(z.unknown())
  })
  .strict();

function violation(field: string, rule: string, message: string): DraftValidationViolation {
  return { field, rule, message };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getActiveDraftPolicyVersion(): string {
  return "CMS Draft Submission Policy v1.0";
}

export function validateDraftSaveInput(
  rawInput: unknown
): { valid: true; value: ValidatedDraftInput } | { valid: false; violations: DraftValidationViolation[] } {
  const parsed = DraftRequestSchema.safeParse(rawInput);

  if (!parsed.success) {
    const violations = parsed.error.issues.map((issue) => {
      const path = issue.path.join(".") || "request";
      return violation(path, issue.code, issue.message);
    });

    return {
      valid: false,
      violations
    };
  }

  const title = parsed.data.title.trim();
  const draftPayload = parsed.data.draftPayload;
  const violations: DraftValidationViolation[] = [];

  if (title.length === 0) {
    violations.push(
      violation("title", "required", "Title is required to save a submission draft.")
    );
  }

  const abstract = draftPayload.abstract;
  if (abstract !== undefined && !isNonEmptyString(abstract)) {
    violations.push(
      violation(
        "draftPayload.abstract",
        "non_empty_string",
        "Abstract must be a non-empty string when provided."
      )
    );
  }

  const keywords = draftPayload.keywords;
  if (keywords !== undefined) {
    if (!Array.isArray(keywords) || keywords.some((entry) => !isNonEmptyString(entry))) {
      violations.push(
        violation(
          "draftPayload.keywords",
          "string_array",
          "Keywords must be an array of non-empty strings when provided."
        )
      );
    }
  }

  const correspondingAuthorEmail = draftPayload.correspondingAuthorEmail;
  if (
    correspondingAuthorEmail !== undefined &&
    (typeof correspondingAuthorEmail !== "string" || !correspondingAuthorEmail.includes("@"))
  ) {
    violations.push(
      violation(
        "draftPayload.correspondingAuthorEmail",
        "email",
        "Corresponding author email must be a valid email when provided."
      )
    );
  }

  if (violations.length > 0) {
    return {
      valid: false,
      violations
    };
  }

  return {
    valid: true,
    value: {
      title,
      draftPayload
    }
  };
}
