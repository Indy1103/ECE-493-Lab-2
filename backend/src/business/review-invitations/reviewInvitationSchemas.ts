import { z } from "zod";

export const InvitationDecisionRequestSchema = z
  .object({
    decision: z.enum(["ACCEPT", "REJECT"])
  })
  .strict();

export type InvitationValidationViolation = {
  rule: "INVALID_DECISION_VALUE" | "INVITATION_NOT_PENDING";
  message: string;
};

export function validateInvitationDecisionRequest(body: unknown):
  | { valid: true; decision: "ACCEPT" | "REJECT" }
  | { valid: false; violations: InvitationValidationViolation[] } {
  const parsed = InvitationDecisionRequestSchema.safeParse(body);

  if (parsed.success) {
    return {
      valid: true,
      decision: parsed.data.decision
    };
  }

  return {
    valid: false,
    violations: [
      {
        rule: "INVALID_DECISION_VALUE",
        message: "Decision must be either ACCEPT or REJECT."
      }
    ]
  };
}
