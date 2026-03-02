import type { ManuscriptFileInput } from "../domain/manuscript-submission.js";
import type { ManuscriptStorageAdapter } from "../../data/manuscripts/manuscript-storage.adapter.js";

const MAX_BYTES = 20 * 1024 * 1024;

interface ManuscriptFileValidationServiceDeps {
  storageAdapter: ManuscriptStorageAdapter;
}

export type ManuscriptFileValidationResult =
  | {
      valid: true;
      storageObjectKey: string;
      mediaType: string;
      byteSize: number;
      sha256Digest: string;
    }
  | {
      valid: false;
      outcome: "FILE_TOO_LARGE" | "FILE_TYPE_NOT_ALLOWED" | "VALIDATION_FAILED";
      message: string;
      violations?: Array<{ field: string; rule: string; message: string }>;
    };

export class ManuscriptFileValidationService {
  constructor(private readonly deps: ManuscriptFileValidationServiceDeps) {}

  async validateAndStore(input: {
    authorId: string;
    requestId: string;
    manuscriptFile: ManuscriptFileInput;
  }): Promise<ManuscriptFileValidationResult> {
    const file = input.manuscriptFile;

    if (file.mediaType !== "application/pdf") {
      return {
        valid: false,
        outcome: "FILE_TYPE_NOT_ALLOWED",
        message: "Only PDF manuscript files are allowed."
      };
    }

    if (file.byteSize > MAX_BYTES) {
      return {
        valid: false,
        outcome: "FILE_TOO_LARGE",
        message: "Manuscript file exceeds the 20 MB limit."
      };
    }

    if (file.sha256Digest.trim().length < 32) {
      return {
        valid: false,
        outcome: "VALIDATION_FAILED",
        message: "File integrity metadata is invalid.",
        violations: [
          {
            field: "manuscriptFile.sha256Digest",
            rule: "invalid_digest",
            message: "SHA-256 digest is required."
          }
        ]
      };
    }

    const stored = await this.deps.storageAdapter.store({
      authorId: input.authorId,
      requestId: input.requestId,
      filename: file.filename,
      mediaType: file.mediaType,
      byteSize: file.byteSize,
      sha256Digest: file.sha256Digest,
      contentBase64: file.contentBase64
    });

    return {
      valid: true,
      storageObjectKey: stored.storageObjectKey,
      mediaType: file.mediaType,
      byteSize: file.byteSize,
      sha256Digest: file.sha256Digest
    };
  }
}
