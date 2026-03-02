import {
  ManuscriptSubmissionRequestSchema,
  SubmissionMetadataSchema
} from "../validation/manuscript-submission.schema.js";
import type { SubmissionMetadata } from "../domain/manuscript-submission.js";

export function mapMetadataValidationViolations(input: {
  metadata: SubmissionMetadata;
  requiredFields: string[];
}): Array<{ field: string; rule: string; message: string }> {
  const violations: Array<{ field: string; rule: string; message: string }> = [];

  const parsed = SubmissionMetadataSchema.safeParse(input.metadata);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      violations.push({
        field: String(issue.path[0] ?? "metadata"),
        rule: issue.code,
        message: issue.message
      });
    }
  }

  for (const field of input.requiredFields) {
    const value = (input.metadata as unknown as Record<string, unknown>)[field];

    if (field === "keywords") {
      if (!Array.isArray(value) || value.length === 0) {
        violations.push({
          field,
          rule: "required",
          message: "At least one keyword is required."
        });
      }
      continue;
    }

    if (field === "fullAuthorList") {
      if (!Array.isArray(value) || value.length === 0) {
        violations.push({
          field,
          rule: "required",
          message: "At least one author is required."
        });
      }
      continue;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
      violations.push({
        field,
        rule: "required",
        message: `${field} is required.`
      });
    }
  }

  return dedupeViolations(violations);
}

function dedupeViolations(
  violations: Array<{ field: string; rule: string; message: string }>
): Array<{ field: string; rule: string; message: string }> {
  const seen = new Set<string>();
  const deduped: Array<{ field: string; rule: string; message: string }> = [];

  for (const violation of violations) {
    const key = `${violation.field}:${violation.rule}:${violation.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(violation);
  }

  return deduped;
}

export function parseSubmissionBody(body: unknown): {
  metadata: SubmissionMetadata;
  manuscriptFile: {
    filename: string;
    mediaType: string;
    byteSize: number;
    sha256Digest: string;
    contentBase64?: string;
  };
  violations: Array<{ field: string; rule: string; message: string }>;
} {
  const parsed = ManuscriptSubmissionRequestSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return {
      metadata: {
        title: "",
        abstract: "",
        keywords: [],
        fullAuthorList: [],
        correspondingAuthorEmail: "",
        primarySubjectArea: ""
      },
      manuscriptFile: {
        filename: "",
        mediaType: "",
        byteSize: 0,
        sha256Digest: ""
      },
      violations: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "request"),
        rule: issue.code,
        message: issue.message
      }))
    };
  }

  return {
    metadata: parsed.data.metadata,
    manuscriptFile: parsed.data.manuscriptFile,
    violations: []
  };
}
