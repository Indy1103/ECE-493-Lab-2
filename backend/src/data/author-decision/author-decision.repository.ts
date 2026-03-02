import { randomUUID } from "node:crypto";

import type {
  AuthorDecisionAccessRecord,
  AuthorDecisionAuditEvent
} from "../../business/author-decision/ports.js";

interface SeedDecisionRecordInput {
  paperId: string;
  authorId: string;
  decision: "ACCEPT" | "REJECT";
  notificationStatus: "DELIVERED" | "FAILED";
}

interface SeedPaperWithoutDecisionInput {
  paperId: string;
  authorId: string;
}

interface AuthorDecisionAuditRepositoryOptions {
  nowProvider?: () => Date;
  emit?: (event: AuthorDecisionAuditEvent) => void;
}

interface DecisionRow {
  paperId: string;
  authorId: string;
  decision: "ACCEPT" | "REJECT";
  notificationStatus: "DELIVERED" | "FAILED";
}

export class PrismaAuthorDecisionRepository {
  private readonly decisionRows = new Map<string, DecisionRow>();
  private readonly paperOwners = new Map<string, string>();

  seedDecisionRecord(input: SeedDecisionRecordInput): void {
    this.paperOwners.set(input.paperId, input.authorId);
    this.decisionRows.set(input.paperId, {
      paperId: input.paperId,
      authorId: input.authorId,
      decision: input.decision,
      notificationStatus: input.notificationStatus
    });
  }

  seedPaperWithoutDecision(input: SeedPaperWithoutDecisionInput): void {
    this.paperOwners.set(input.paperId, input.authorId);
  }

  async getAuthorDecision(
    paperId: string,
    authorId: string
  ): Promise<AuthorDecisionAccessRecord | null> {
    const owner = this.paperOwners.get(paperId);

    if (!owner || owner !== authorId) {
      return null;
    }

    const row = this.decisionRows.get(paperId);

    if (!row) {
      return null;
    }

    return {
      paperId: row.paperId,
      authorId: row.authorId,
      decision: row.decision,
      notificationStatus: row.notificationStatus
    };
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output = { ...metadata };

  if ("authorId" in output) {
    delete output.authorId;
  }

  if ("decision" in output) {
    output.decision = "[REDACTED]";
  }

  return output;
}

export class AuthorDecisionAuditRepository {
  private readonly events: AuthorDecisionAuditEvent[] = [];
  private readonly nowProvider: () => Date;
  private readonly emit?: (event: AuthorDecisionAuditEvent) => void;

  constructor(options: AuthorDecisionAuditRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.emit = options.emit;
  }

  async record(event: Omit<AuthorDecisionAuditEvent, "eventId" | "occurredAt">): Promise<void> {
    const nextEvent: AuthorDecisionAuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: this.nowProvider(),
      metadata: redactMetadata(event.metadata)
    };

    this.events.push(nextEvent);
    this.emit?.({ ...nextEvent, metadata: { ...nextEvent.metadata } });
  }

  list(): AuthorDecisionAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata }
    }));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

export const AUTHOR_DECISION_PRISMA_REPOSITORY_MARKER =
  "author_decision_prisma_repository_marker" as const;

export const AUTHOR_DECISION_AUDIT_REPOSITORY_MARKER =
  "author_decision_audit_repository_marker" as const;
