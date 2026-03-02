import { z } from "zod";

import type { SaveSubmissionDraftOutcome } from "../../business/submission-drafts/SaveSubmissionDraftUseCase.js";
import type { GetSubmissionDraftOutcome } from "../../business/submission-drafts/GetSubmissionDraftUseCase.js";

export const DraftViolationSchema = z.object({
  field: z.string(),
  rule: z.string(),
  message: z.string()
});

export const SaveDraftSuccessResponseSchema = z.object({
  submissionId: z.string(),
  savedAt: z.string(),
  message: z.string()
});

export const SaveDraftValidationErrorSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  violations: z.array(DraftViolationSchema)
});

export const SubmissionDraftErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string()
});

export const GetDraftSuccessResponseSchema = z.object({
  submissionId: z.string(),
  title: z.string(),
  draftPayload: z.record(z.unknown()),
  lastSavedAt: z.string()
});

export function mapSaveDraftOutcomeToHttp(outcome: SaveSubmissionDraftOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: SaveDraftSuccessResponseSchema.parse({
          submissionId: outcome.submissionId,
          savedAt: outcome.savedAt,
          message: outcome.message
        })
      };
    case "VALIDATION_FAILED":
      return {
        statusCode: 400,
        body: SaveDraftValidationErrorSchema.parse({
          code: outcome.code,
          message: outcome.message,
          violations: outcome.violations
        })
      };
    case "AUTHORIZATION_FAILED":
      return {
        statusCode: 403,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "CONCURRENT_SAVE_RESOLVED":
      return {
        statusCode: 409,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "OPERATIONAL_FAILURE":
      return {
        statusCode: 500,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: "OPERATIONAL_FAILURE",
          message: "Draft could not be saved. Please retry."
        })
      };
  }
}

export function mapGetDraftOutcomeToHttp(outcome: GetSubmissionDraftOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: GetDraftSuccessResponseSchema.parse({
          submissionId: outcome.submissionId,
          title: outcome.title,
          draftPayload: outcome.draftPayload,
          lastSavedAt: outcome.lastSavedAt
        })
      };
    case "AUTHORIZATION_FAILED":
      return {
        statusCode: 403,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "DRAFT_NOT_FOUND":
      return {
        statusCode: 404,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "OPERATIONAL_FAILURE":
      return {
        statusCode: 500,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: SubmissionDraftErrorResponseSchema.parse({
          code: "OPERATIONAL_FAILURE",
          message: "Draft could not be retrieved. Please retry."
        })
      };
  }
}
