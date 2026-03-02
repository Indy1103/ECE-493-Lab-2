import type {
  AssignmentAuditOutcome,
  RefereeAssignmentRepository
} from "../../data/referee-assignments/RefereeAssignmentRepository.js";

export interface RefereeAssignmentAuditEvent {
  requestId: string;
  paperId: string;
  editorId: string | null;
  submittedRefereeIdsCount: number;
  outcome: AssignmentAuditOutcome;
  reasonCode: string;
}

interface RefereeAssignmentAuditServiceDeps {
  repository: Pick<RefereeAssignmentRepository, "recordAudit">;
  emit?: (event: Record<string, unknown>) => void;
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("displayname") ||
    normalized.includes("workload") ||
    normalized.includes("invitation") ||
    normalized.includes("profile")
  );
}

export function redactRefereeAssignmentAuditContext(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    redacted[key] = shouldRedactKey(key) ? "[REDACTED]" : value;
  }

  return redacted;
}

export class RefereeAssignmentAuditService {
  constructor(private readonly deps: RefereeAssignmentAuditServiceDeps) {}

  async recordOutcome(event: RefereeAssignmentAuditEvent): Promise<void> {
    await this.deps.repository.recordAudit({
      requestId: event.requestId,
      paperId: event.paperId,
      editorId: event.editorId,
      submittedRefereeIdsCount: event.submittedRefereeIdsCount,
      outcome: event.outcome,
      reasonCode: event.reasonCode
    });

    const emission = redactRefereeAssignmentAuditContext({
      eventType: "referee_assignment_attempt",
      requestId: event.requestId,
      paperId: event.paperId,
      editorId: event.editorId,
      submittedRefereeIdsCount: event.submittedRefereeIdsCount,
      outcome: event.outcome,
      reasonCode: event.reasonCode
    });

    this.deps.emit?.(emission);
  }
}
