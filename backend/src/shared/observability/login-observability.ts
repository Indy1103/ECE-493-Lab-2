import pino, { type Logger } from "pino";
import { Counter, Registry } from "prom-client";

import type { LoginAttemptOutcome } from "../../data/auth/auth.repository.js";
import { redactSensitive } from "../../security/sensitiveDataPolicy.js";

export interface LoginObservability {
  record(event: {
    requestId: string;
    clientKey: string;
    username: string;
    outcome: LoginAttemptOutcome;
    details?: Record<string, unknown>;
  }): void;
}

interface LoginObservabilityOptions {
  emit?: (event: Record<string, unknown>) => void;
  logger?: Logger;
  registry?: Registry;
}

export function createLoginObservability(
  options: LoginObservabilityOptions = {}
): LoginObservability {
  const registry = options.registry ?? new Registry();
  const logger = options.logger ?? pino({ level: "info" });

  const loginOutcomesCounter = new Counter({
    name: "login_outcomes_total",
    help: "Login outcomes by category",
    labelNames: ["outcome"],
    registers: [registry]
  });

  return {
    record(event): void {
      loginOutcomesCounter.inc({ outcome: event.outcome });

      const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        requestId: event.requestId,
        clientKey: event.clientKey,
        username: event.username,
        outcome: event.outcome,
        details: redactSensitive(event.details ?? {})
      };

      logger.info(entry);
      options.emit?.(entry);
    }
  };
}
