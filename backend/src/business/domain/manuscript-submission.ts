export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "WITHDRAWN"
  | "REJECTED"
  | "ARCHIVED";

export interface SubmissionMetadata {
  title: string;
  abstract: string;
  keywords: string[];
  fullAuthorList: Array<{ name: string; affiliation?: string }>;
  correspondingAuthorEmail: string;
  primarySubjectArea: string;
}

export interface ManuscriptFileInput {
  filename: string;
  mediaType: string;
  byteSize: number;
  sha256Digest: string;
  contentBase64?: string;
}

export interface CreateSubmissionInput {
  authorId: string;
  requestId: string;
  sourceIp: string;
  metadata: SubmissionMetadata;
  manuscriptFile: ManuscriptFileInput;
}

export type SubmissionRequirementsOutcome =
  | {
      outcome: "REQUIREMENTS";
      cycleId: string;
      intakeStatus: "OPEN" | "CLOSED";
      metadataPolicyVersion: string;
      requiredMetadataFields: string[];
      fileConstraints: { allowedMediaTypes: string[]; maxBytes: number };
    }
  | { outcome: "INTAKE_CLOSED" };

export type CreateSubmissionOutcome =
  | {
      outcome: "SUCCESS";
      submissionId: string;
      status: "SUBMITTED";
      message: string;
    }
  | {
      outcome: "VALIDATION_FAILED";
      code: "VALIDATION_FAILED";
      message: string;
      violations: Array<{ field: string; rule: string; message: string }>;
    }
  | { outcome: "INTAKE_CLOSED"; code: "INTAKE_CLOSED"; message: string }
  | {
      outcome: "DUPLICATE";
      code: "DUPLICATE_ACTIVE_SUBMISSION";
      message: string;
    }
  | {
      outcome: "FILE_TOO_LARGE";
      code: "FILE_TOO_LARGE";
      message: string;
    }
  | {
      outcome: "FILE_TYPE_NOT_ALLOWED";
      code: "FILE_TYPE_NOT_ALLOWED";
      message: string;
    }
  | { outcome: "OPERATIONAL_FAILURE"; code: "OPERATIONAL_FAILURE"; message: string };
