import type { SubmissionAttemptAuditRepository } from "../../data/manuscripts/submission-attempt-audit.repository.js";
import type { ManuscriptSubmissionMetrics } from "./manuscript-submission-metrics.js";

interface ManuscriptSubmissionObservabilityServiceDeps {
  auditRepository: SubmissionAttemptAuditRepository;
  metrics?: ManuscriptSubmissionMetrics;
}

export class ManuscriptSubmissionObservabilityService {
  constructor(private readonly deps: ManuscriptSubmissionObservabilityServiceDeps) {}

  async recordAttempt(input: {
    authorId: string | null;
    submissionId: string | null;
    requestId: string;
    outcome:
      | "SUCCESS"
      | "AUTHZ_FAILED"
      | "METADATA_INVALID"
      | "FILE_INVALID"
      | "DUPLICATE_REJECTED"
      | "INTAKE_CLOSED"
      | "OPERATIONAL_FAILED";
    reasonCode: string;
  }): Promise<void> {
    await this.deps.auditRepository.record(input);
    this.deps.metrics?.incrementOutcome(input.outcome);

    if (input.outcome === "DUPLICATE_REJECTED") {
      this.deps.metrics?.incrementDuplicateConflict();
    }
  }

  observeLatencyMs(durationMs: number): void {
    this.deps.metrics?.observeLatencyMs(durationMs);
  }

  snapshot() {
    return this.deps.auditRepository.snapshot();
  }

  restore(snapshot: ReturnType<SubmissionAttemptAuditRepository["snapshot"]>): void {
    this.deps.auditRepository.restore(snapshot);
  }
}
