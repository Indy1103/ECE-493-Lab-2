import type {
  InvitationDecision,
  InvitationResponseAttemptOutcome,
  ReviewInvitationRepository
} from "../../data/review-invitations/ReviewInvitationRepository.js";

export interface ReviewInvitationAuditEvent {
  requestId: string;
  invitationId: string;
  refereeId: string | null;
  decision: InvitationDecision;
  outcome: InvitationResponseAttemptOutcome;
  reasonCode: string;
}

interface ReviewInvitationAuditServiceDeps {
  repository: Pick<ReviewInvitationRepository, "recordResponseAttempt">;
  emit?: (event: Record<string, unknown>) => void;
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("papersummary") ||
    normalized.includes("displayname") ||
    normalized.includes("workload") ||
    normalized.includes("reviewer")
  );
}

export function redactReviewInvitationAuditContext(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    redacted[key] = shouldRedactKey(key) ? "[REDACTED]" : value;
  }

  return redacted;
}

export class ReviewInvitationAuditService {
  constructor(private readonly deps: ReviewInvitationAuditServiceDeps) {}

  async recordOutcome(event: ReviewInvitationAuditEvent): Promise<void> {
    await this.deps.repository.recordResponseAttempt({
      invitationId: event.invitationId,
      refereeId: event.refereeId,
      decisionRequested: event.decision,
      outcome: event.outcome,
      reasonCode: event.reasonCode,
      requestId: event.requestId
    });

    const emission = redactReviewInvitationAuditContext({
      eventType: "review_invitation_response",
      requestId: event.requestId,
      invitationId: event.invitationId,
      refereeId: event.refereeId,
      decision: event.decision,
      outcome: event.outcome,
      reasonCode: event.reasonCode
    });

    this.deps.emit?.(emission);
  }
}
