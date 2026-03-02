import type {
  DraftSaveAttemptOutcome,
  SubmissionDraftRepository
} from "../../data/submission-drafts/SubmissionDraftRepository.js";

export interface SubmissionDraftAuditEvent {
  authorId: string | null;
  submissionId: string | null;
  requestId: string;
  outcome: DraftSaveAttemptOutcome;
  reasonCode: string;
}

interface SubmissionDraftAuditServiceDeps {
  repository: Pick<SubmissionDraftRepository, "recordDraftSaveAttempt">;
  emit?: (event: Record<string, unknown>) => void;
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.includes("draft") ||
    normalized.includes("payload") ||
    normalized.includes("title") ||
    normalized.includes("abstract") ||
    normalized.includes("keyword")
  );
}

export function redactSubmissionDraftAuditContext(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    result[key] = shouldRedactKey(key) ? "[REDACTED]" : value;
  }

  return result;
}

export class SubmissionDraftAuditService {
  constructor(private readonly deps: SubmissionDraftAuditServiceDeps) {}

  async recordAttempt(event: SubmissionDraftAuditEvent): Promise<void> {
    await this.deps.repository.recordDraftSaveAttempt({
      authorId: event.authorId,
      submissionId: event.submissionId,
      outcome: event.outcome,
      reasonCode: event.reasonCode,
      requestId: event.requestId
    });

    const emitted = redactSubmissionDraftAuditContext({
      eventType: "submission_draft_save_attempt",
      authorId: event.authorId,
      submissionId: event.submissionId,
      requestId: event.requestId,
      outcome: event.outcome,
      reasonCode: event.reasonCode
    });

    this.deps.emit?.(emitted);
  }
}
