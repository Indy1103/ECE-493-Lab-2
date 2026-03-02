import { Counter, Histogram, Registry } from "prom-client";

export interface PasswordChangeMetrics {
  incrementOutcome(outcome: string): void;
  observeLatencyMs(durationMs: number): void;
}

interface PasswordChangeMetricsOptions {
  registry?: Registry;
}

export function createPasswordChangeMetrics(
  options: PasswordChangeMetricsOptions = {}
): PasswordChangeMetrics {
  const registry = options.registry ?? new Registry();

  const outcomeCounter = new Counter({
    name: "password_change_outcomes_total",
    help: "Password change outcomes by result",
    labelNames: ["outcome"],
    registers: [registry]
  });

  const latencyHistogram = new Histogram({
    name: "password_change_latency_ms",
    help: "Password change end-to-end latency in milliseconds",
    buckets: [50, 100, 250, 500, 1000],
    registers: [registry]
  });

  return {
    incrementOutcome(outcome: string): void {
      outcomeCounter.inc({ outcome });
    },
    observeLatencyMs(durationMs: number): void {
      latencyHistogram.observe(durationMs);
    }
  };
}
