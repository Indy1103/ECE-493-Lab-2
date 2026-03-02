import { z } from "zod";

export type AssignmentViolationRule =
  | "DUPLICATE_REFEREE_IN_REQUEST"
  | "REFEREE_NOT_ASSIGNABLE"
  | "REFEREE_WORKLOAD_LIMIT_REACHED"
  | "PAPER_REFEREE_CAPACITY_REACHED"
  | "PAPER_NOT_AWAITING_ASSIGNMENT";

export interface AssignmentViolation {
  rule: AssignmentViolationRule;
  message: string;
  refereeId?: string;
}

export const AssignRefereesRequestSchema = z
  .object({
    refereeIds: z.array(z.string().min(1)).min(1)
  })
  .strict();

function violation(rule: AssignmentViolationRule, message: string, refereeId?: string): AssignmentViolation {
  if (!refereeId) {
    return { rule, message };
  }

  return {
    rule,
    message,
    refereeId
  };
}

export function validateAssignRefereesRequest(
  input: unknown
): { valid: true; refereeIds: string[] } | { valid: false; violations: AssignmentViolation[] } {
  const parsed = AssignRefereesRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      valid: false,
      violations: [
        violation("REFEREE_NOT_ASSIGNABLE", "Assignment request payload is invalid.")
      ]
    };
  }

  const trimmedRefereeIds = parsed.data.refereeIds.map((value) => value.trim());
  const unique = new Set<string>();
  const duplicates = new Set<string>();

  for (const refereeId of trimmedRefereeIds) {
    if (unique.has(refereeId)) {
      duplicates.add(refereeId);
      continue;
    }

    unique.add(refereeId);
  }

  if (duplicates.size > 0) {
    return {
      valid: false,
      violations: Array.from(duplicates).map((refereeId) =>
        violation(
          "DUPLICATE_REFEREE_IN_REQUEST",
          "Duplicate referee identifiers are not allowed in one assignment request.",
          refereeId
        )
      )
    };
  }

  return {
    valid: true,
    refereeIds: trimmedRefereeIds
  };
}
