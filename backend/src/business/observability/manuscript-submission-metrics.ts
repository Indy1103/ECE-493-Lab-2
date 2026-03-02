import { Counter, Histogram, Registry } from "prom-client";

export interface ManuscriptSubmissionMetrics {
  incrementOutcome(outcome: string): void;
  incrementDuplicateConflict(): void;
  observeLatencyMs(durationMs: number): void;
}

export function createManuscriptSubmissionMetrics(options: {
  registry?: Registry;
} = {}): ManuscriptSubmissionMetrics {
  const registry = options.registry ?? new Registry();

  const outcomeCounter = new Counter({
    name: "manuscript_submission_outcomes_total",
    help: "Count of manuscript submission outcomes",
    labelNames: ["outcome"],
    registers: [registry]
  });

  const duplicateCounter = new Counter({
    name: "manuscript_submission_duplicate_conflicts_total",
    help: "Count of duplicate submission conflicts",
    registers: [registry]
  });

  const latencyHistogram = new Histogram({
    name: "manuscript_submission_latency_ms",
    help: "End-to-end manuscript submission latency in milliseconds",
    buckets: [100, 250, 500, 700, 1000],
    registers: [registry]
  });

  return {
    incrementOutcome(outcome: string): void {
      outcomeCounter.inc({ outcome });
    },
    incrementDuplicateConflict(): void {
      duplicateCounter.inc();
    },
    observeLatencyMs(durationMs: number): void {
      latencyHistogram.observe(durationMs);
    }
  };
}
