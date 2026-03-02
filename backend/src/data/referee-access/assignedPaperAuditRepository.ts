import { randomUUID } from "node:crypto";

export type AssignedPaperAuditOutcome =
  | "SUCCESS"
  | "NO_ASSIGNMENTS"
  | "UNAVAILABLE"
  | "UNAVAILABLE_OR_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "FORM_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface AssignedPaperAccessAuditEvent {
  eventId: string;
  actorUserId: string;
  paperId: string | null;
  assignmentId: string | null;
  outcome: AssignedPaperAuditOutcome;
  reasonCode: string;
  occurredAt: Date;
}

interface AssignedPaperAuditRepositoryOptions {
  nowProvider?: () => Date;
  emit?: (event: Record<string, unknown>) => void;
}

function shouldRedactAuditKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("fileobjectkey") ||
    normalized.includes("contenturl") ||
    normalized.includes("formurl") ||
    normalized.includes("abstractpreview")
  );
}

export function redactAssignedPaperAuditPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    redacted[key] = shouldRedactAuditKey(key) ? "[REDACTED]" : value;
  }

  return redacted;
}

export class AssignedPaperAuditRepository {
  private readonly nowProvider: () => Date;
  private readonly emit?: (event: Record<string, unknown>) => void;
  private readonly events: AssignedPaperAccessAuditEvent[] = [];

  constructor(options: AssignedPaperAuditRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.emit = options.emit;
  }

  async record(input: {
    actorUserId: string;
    paperId?: string | null;
    assignmentId?: string | null;
    outcome: AssignedPaperAuditOutcome;
    reasonCode: string;
  }): Promise<void> {
    const event: AssignedPaperAccessAuditEvent = {
      eventId: randomUUID(),
      actorUserId: input.actorUserId,
      paperId: input.paperId ?? null,
      assignmentId: input.assignmentId ?? null,
      outcome: input.outcome,
      reasonCode: input.reasonCode,
      occurredAt: this.nowProvider()
    };

    this.events.push(event);

    this.emit?.(
      redactAssignedPaperAuditPayload({
        eventType: "assigned_paper_access",
        eventId: event.eventId,
        actorUserId: event.actorUserId,
        paperId: event.paperId,
        assignmentId: event.assignmentId,
        outcome: event.outcome,
        reasonCode: event.reasonCode,
        occurredAt: event.occurredAt.toISOString()
      })
    );
  }

  list(): AssignedPaperAccessAuditEvent[] {
    return this.events.map((entry) => ({ ...entry }));
  }
}
