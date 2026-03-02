import { z } from "zod";

import type { AssignRefereesOutcome } from "../../business/referee-assignments/AssignRefereesUseCase.js";
import type { GetAssignmentOptionsOutcome } from "../../business/referee-assignments/GetAssignmentOptionsUseCase.js";

export const RefereeAssignmentErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string()
});

export const AssignmentViolationSchema = z.object({
  rule: z.string(),
  message: z.string(),
  refereeId: z.string().optional()
});

export const AssignmentValidationErrorResponseSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  violations: z.array(AssignmentViolationSchema)
});

export const AssignmentOptionsResponseSchema = z.object({
  paperId: z.string(),
  currentAssignedCount: z.number(),
  remainingSlots: z.number(),
  maxRefereesPerPaper: z.number(),
  candidateReferees: z.array(
    z.object({
      refereeId: z.string(),
      displayName: z.string(),
      currentWorkload: z.number(),
      maxWorkload: z.number(),
      eligible: z.boolean()
    })
  )
});

export const AssignRefereesSuccessResponseSchema = z.object({
  paperId: z.string(),
  assignedRefereeIds: z.array(z.string()),
  invitationStatuses: z.array(
    z.object({
      refereeId: z.string(),
      status: z.enum(["SENT", "PENDING_RETRY"])
    })
  ),
  message: z.string()
});

export function mapGetAssignmentOptionsOutcome(outcome: GetAssignmentOptionsOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: AssignmentOptionsResponseSchema.parse({
          paperId: outcome.paperId,
          currentAssignedCount: outcome.currentAssignedCount,
          remainingSlots: outcome.remainingSlots,
          maxRefereesPerPaper: outcome.maxRefereesPerPaper,
          candidateReferees: outcome.candidateReferees
        })
      };
    case "PAPER_NOT_FOUND":
    case "PAPER_NOT_ASSIGNABLE":
      return {
        statusCode: 404,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: "INTERNAL_ERROR",
          message: "Assignment options are currently unavailable."
        })
      };
  }
}

export function mapAssignRefereesOutcome(outcome: AssignRefereesOutcome): {
  statusCode: number;
  body: Record<string, unknown>;
} {
  switch (outcome.outcome) {
    case "SUCCESS":
      return {
        statusCode: 200,
        body: AssignRefereesSuccessResponseSchema.parse({
          paperId: outcome.paperId,
          assignedRefereeIds: outcome.assignedRefereeIds,
          invitationStatuses: outcome.invitationStatuses,
          message: outcome.message
        })
      };
    case "VALIDATION_FAILED":
      return {
        statusCode: 400,
        body: AssignmentValidationErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message,
          violations: outcome.violations
        })
      };
    case "PAPER_NOT_FOUND":
    case "PAPER_NOT_ASSIGNABLE":
      return {
        statusCode: 404,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "ASSIGNMENT_CONFLICT":
      return {
        statusCode: 409,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    case "INTERNAL_ERROR":
      return {
        statusCode: 500,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: outcome.code,
          message: outcome.message
        })
      };
    default:
      return {
        statusCode: 500,
        body: RefereeAssignmentErrorResponseSchema.parse({
          code: "INTERNAL_ERROR",
          message: "Referee assignment failed unexpectedly."
        })
      };
  }
}
