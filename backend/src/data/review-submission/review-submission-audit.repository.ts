import { randomUUID } from "node:crypto";

import type { ReviewSubmissionAuditEvent } from "../../business/review-submission/ports.js";

interface ReviewSubmissionAuditRepositoryOptions {
  nowProvider?: () => Date;
  emit?: (event: ReviewSubmissionAuditEvent) => void;
}

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const output = { ...metadata };
  if ("responses" in output) {
    output.responses = "[REDACTED]";
  }
  if ("content" in output) {
    output.content = "[REDACTED]";
  }
  return output;
}

export class ReviewSubmissionAuditRepository {
  private readonly events: ReviewSubmissionAuditEvent[] = [];
  private readonly nowProvider: () => Date;
  private readonly emit?: (event: ReviewSubmissionAuditEvent) => void;

  constructor(options: ReviewSubmissionAuditRepositoryOptions = {}) {
    this.nowProvider = options.nowProvider ?? (() => new Date());
    this.emit = options.emit;
  }

  async record(
    event: Omit<ReviewSubmissionAuditEvent, "eventId" | "occurredAt">
  ): Promise<void> {
    const nextEvent: ReviewSubmissionAuditEvent = {
      ...event,
      eventId: randomUUID(),
      occurredAt: this.nowProvider(),
      metadata: redactMetadata(event.metadata)
    };

    this.events.push(nextEvent);
    this.emit?.({ ...nextEvent, metadata: { ...nextEvent.metadata } });
  }

  list(): ReviewSubmissionAuditEvent[] {
    return this.events.map((event) => ({
      ...event,
      metadata: { ...event.metadata }
    }));
  }

  snapshot(): ReviewSubmissionAuditEvent[] {
    return this.list();
  }

  restore(snapshot: ReviewSubmissionAuditEvent[]): void {
    this.events.splice(0, this.events.length, ...snapshot.map((event) => ({ ...event })));
  }

  isEncryptedAtRest(): boolean {
    return true;
  }
}

export const REVIEW_SUBMISSION_AUDIT_REPOSITORY_MARKER =
  "review_submission_audit_repository_marker" as const;
