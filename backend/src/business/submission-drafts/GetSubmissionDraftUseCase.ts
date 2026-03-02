import {
  SubmissionDraftAuthorizationError,
  SubmissionDraftOwnershipGuard
} from "../../security/submissionDraftOwnership.js";
import type { SubmissionDraftRepository } from "../../data/submission-drafts/SubmissionDraftRepository.js";

export type GetSubmissionDraftOutcome =
  | {
      outcome: "SUCCESS";
      submissionId: string;
      title: string;
      draftPayload: Record<string, unknown>;
      lastSavedAt: string;
      policyVersion: string;
    }
  | {
      outcome: "AUTHORIZATION_FAILED";
      code: "AUTHORIZATION_FAILED";
      message: string;
    }
  | {
      outcome: "DRAFT_NOT_FOUND";
      code: "DRAFT_NOT_FOUND";
      message: string;
    }
  | {
      outcome: "OPERATIONAL_FAILURE";
      code: "OPERATIONAL_FAILURE";
      message: string;
    };

interface GetSubmissionDraftUseCaseDeps {
  repository: SubmissionDraftRepository;
  ownershipGuard: SubmissionDraftOwnershipGuard;
}

export class GetSubmissionDraftUseCase {
  constructor(private readonly deps: GetSubmissionDraftUseCaseDeps) {}

  async execute(input: {
    authorId: string;
    submissionId: string;
  }): Promise<GetSubmissionDraftOutcome> {
    try {
      await this.deps.ownershipGuard.assertOwnership(input.authorId, input.submissionId);
    } catch (error) {
      if (error instanceof SubmissionDraftAuthorizationError) {
        return {
          outcome: "AUTHORIZATION_FAILED",
          code: "AUTHORIZATION_FAILED",
          message: "You are not authorized to access this submission draft."
        };
      }

      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "OPERATIONAL_FAILURE",
        message: "Draft could not be retrieved. Please retry."
      };
    }

    try {
      const row = await this.deps.repository.getDraft(input.authorId, input.submissionId);
      if (!row) {
        return {
          outcome: "DRAFT_NOT_FOUND",
          code: "DRAFT_NOT_FOUND",
          message: "No saved draft exists for this submission."
        };
      }

      return {
        outcome: "SUCCESS",
        submissionId: row.inProgressSubmissionId,
        title: row.title,
        draftPayload: row.draftPayload,
        lastSavedAt: row.lastSavedAt.toISOString(),
        policyVersion: row.policyVersion
      };
    } catch {
      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "OPERATIONAL_FAILURE",
        message: "Draft could not be retrieved. Please retry."
      };
    }
  }
}
