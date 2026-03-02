export interface ManuscriptSubmissionMetadata {
  title: string;
  abstract: string;
  keywords: string[];
  fullAuthorList: Array<{ name: string; affiliation?: string }>;
  correspondingAuthorEmail: string;
  primarySubjectArea: string;
}

export interface ManuscriptSubmissionFile {
  filename: string;
  mediaType: string;
  byteSize: number;
  sha256Digest: string;
  contentBase64?: string;
}

export interface SubmissionRequirements {
  cycleId: string;
  intakeStatus: "OPEN" | "CLOSED";
  metadataPolicyVersion: string;
  requiredMetadataFields: string[];
  fileConstraints: {
    allowedMediaTypes: string[];
    maxBytes: number;
  };
}

export type SubmissionRequirementsResult =
  | { status: "REQUIREMENTS"; requirements: SubmissionRequirements }
  | {
      status: "UNAVAILABLE";
      code:
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "INTAKE_CLOSED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      message: string;
    };

export type SubmitManuscriptResult =
  | { status: "SUCCESS"; submissionId: string; message: string }
  | {
      status: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | {
      status:
        | "INTAKE_CLOSED"
        | "DUPLICATE_ACTIVE_SUBMISSION"
        | "FILE_TOO_LARGE"
        | "FILE_TYPE_NOT_ALLOWED"
        | "AUTHENTICATION_REQUIRED"
        | "AUTHORIZATION_FAILED"
        | "TLS_REQUIRED"
        | "OPERATIONAL_FAILURE";
      code: string;
      message: string;
    };

export async function fetchManuscriptSubmissionRequirements(
  baseUrl = ""
): Promise<SubmissionRequirementsResult> {
  const response = await fetch(`${baseUrl}/api/v1/manuscript-submissions/requirements`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 200) {
    return {
      status: "REQUIREMENTS",
      requirements: {
        cycleId: String(body.cycleId ?? ""),
        intakeStatus: body.intakeStatus === "CLOSED" ? "CLOSED" : "OPEN",
        metadataPolicyVersion: String(body.metadataPolicyVersion ?? ""),
        requiredMetadataFields: Array.isArray(body.requiredMetadataFields)
          ? body.requiredMetadataFields.map((field) => String(field))
          : [],
        fileConstraints: {
          allowedMediaTypes:
            typeof body.fileConstraints === "object" &&
            body.fileConstraints &&
            Array.isArray((body.fileConstraints as Record<string, unknown>).allowedMediaTypes)
              ? ((body.fileConstraints as Record<string, unknown>).allowedMediaTypes as unknown[]).map(
                  (value) => String(value)
                )
              : [],
          maxBytes:
            typeof body.fileConstraints === "object" &&
            body.fileConstraints &&
            typeof (body.fileConstraints as Record<string, unknown>).maxBytes === "number"
              ? Number((body.fileConstraints as Record<string, unknown>).maxBytes)
              : 0
        }
      }
    };
  }

  return {
    status: "UNAVAILABLE",
    code: mapRequirementsErrorCode(body.code),
    message: String(body.message ?? "Submission requirements are unavailable.")
  };
}

export async function submitManuscript(
  input: { metadata: ManuscriptSubmissionMetadata; manuscriptFile: ManuscriptSubmissionFile },
  baseUrl = ""
): Promise<SubmitManuscriptResult> {
  const response = await fetch(`${baseUrl}/api/v1/manuscript-submissions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });
  const body = (await response.json()) as Record<string, unknown>;

  if (response.status === 201) {
    return {
      status: "SUCCESS",
      submissionId: String(body.submissionId ?? ""),
      message: String(body.message ?? "Manuscript submitted successfully.")
    };
  }

  if (response.status === 400) {
    return {
      status: "VALIDATION_FAILED",
      code: "VALIDATION_FAILED",
      message: String(body.message ?? "Metadata validation failed."),
      violations: Array.isArray(body.violations)
        ? (body.violations as Array<{ field: string; rule: string; message: string }>)
        : []
    };
  }

  const mappedStatus = mapSubmitErrorCode(body.code);
  return {
    status: mappedStatus,
    code: mappedStatus,
    message: String(body.message ?? "Submission could not be completed. Please retry.")
  };
}

function mapRequirementsErrorCode(
  code: unknown
): "AUTHENTICATION_REQUIRED" | "AUTHORIZATION_FAILED" | "INTAKE_CLOSED" | "TLS_REQUIRED" | "OPERATIONAL_FAILURE" {
  switch (code) {
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "INTAKE_CLOSED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}

function mapSubmitErrorCode(
  code: unknown
): Exclude<SubmitManuscriptResult, { status: "SUCCESS" | "VALIDATION_FAILED" }>["status"] {
  switch (code) {
    case "INTAKE_CLOSED":
    case "DUPLICATE_ACTIVE_SUBMISSION":
    case "FILE_TOO_LARGE":
    case "FILE_TYPE_NOT_ALLOWED":
    case "AUTHENTICATION_REQUIRED":
    case "AUTHORIZATION_FAILED":
    case "TLS_REQUIRED":
      return code;
    default:
      return "OPERATIONAL_FAILURE";
  }
}
