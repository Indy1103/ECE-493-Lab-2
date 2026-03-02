import type { Logger } from "pino";

import type { RegistrationOutcomeCategory } from "../contracts/registrationOutcome.js";
import { redactSensitive } from "../../security/sensitiveDataPolicy.js";
import type { RegistrationMetrics } from "./registrationMetrics.js";

export interface RegistrationTelemetry {
  record(event: {
    requestId: string;
    clientKey: string;
    outcome: RegistrationOutcomeCategory;
    details?: Record<string, unknown>;
  }): void;
}

interface CreateRegistrationTelemetryOptions {
  metrics: RegistrationMetrics;
  emit?: (entry: Record<string, unknown>) => void;
  logger?: Logger;
}

export function createRegistrationTelemetry(
  options: CreateRegistrationTelemetryOptions
): RegistrationTelemetry {
  return {
    record(event): void {
      options.metrics.incrementOutcome(event.outcome);
      if (event.outcome === "THROTTLED") {
        options.metrics.incrementThrottled();
      }

      const telemetryEntry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        requestId: event.requestId,
        clientKey: event.clientKey,
        outcome: event.outcome,
        details: redactSensitive(event.details ?? {})
      };

      options.logger?.info(telemetryEntry);
      options.emit?.(telemetryEntry);
    }
  };
}
