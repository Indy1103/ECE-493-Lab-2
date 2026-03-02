import { Counter, Registry } from "prom-client";

import type { RegistrationOutcomeCategory } from "../contracts/registrationOutcome.js";

export interface RegistrationMetrics {
  incrementOutcome(outcome: RegistrationOutcomeCategory): void;
  incrementThrottled(): void;
}

export function createRegistrationMetrics(
  registry: Registry = new Registry()
): RegistrationMetrics {
  const registrationOutcomeCounter = new Counter({
    name: "registration_outcomes_total",
    help: "Registration outcomes by category",
    labelNames: ["outcome"],
    registers: [registry]
  });

  const registrationThrottledCounter = new Counter({
    name: "registration_throttled_total",
    help: "Registration throttling events",
    registers: [registry]
  });

  return {
    incrementOutcome(outcome: RegistrationOutcomeCategory): void {
      registrationOutcomeCounter.inc({ outcome });
    },
    incrementThrottled(): void {
      registrationThrottledCounter.inc();
    }
  };
}
