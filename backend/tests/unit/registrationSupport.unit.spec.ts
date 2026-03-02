import test from "node:test";
import assert from "node:assert/strict";

import type { ZodIssue } from "zod";

import { RegistrationThrottleService } from "../../src/business/registration/registrationThrottleService.js";
import { mapValidationIssues } from "../../src/business/registration/validationErrorMapper.js";
import { RegisterUserUseCase } from "../../src/business/registration/registerUser.js";
import {
  REGISTRATION_FIELDS,
  REGISTRATION_OUTCOMES
} from "../../src/shared/contracts/registrationOutcome.js";
import {
  EmailAlreadyRegisteredError,
  type UserAccountRepository
} from "../../src/data/repositories/userAccountRepository.js";
import {
  InMemoryRegistrationThrottleRepository
} from "../../src/data/repositories/registrationThrottleRepository.js";
import { assertPublicRegistrationRoute } from "../../src/presentation/routes/publicRoutePolicy.js";
import { Argon2PasswordHasher } from "../../src/security/passwordHasher.js";
import { redactSensitive } from "../../src/security/sensitiveDataPolicy.js";
import { createRegistrationLogger } from "../../src/shared/observability/logger.js";
import { createRegistrationTelemetry } from "../../src/shared/observability/registrationTelemetry.js";
import { buildClientKey, extractRequestContext } from "../../src/shared/observability/requestContext.js";

test("validation mapper drops unknown fields", () => {
  const issues: ZodIssue[] = [
    {
      code: "custom",
      message: "ignored",
      path: ["unknown"]
    } as ZodIssue
  ];

  const mapped = mapValidationIssues(issues);
  assert.deepEqual(mapped, []);
});

test("registration contract constants expose expected outcomes and fields", () => {
  assert.equal(REGISTRATION_OUTCOMES.includes("REGISTERED"), true);
  assert.deepEqual(REGISTRATION_FIELDS, ["fullName", "email", "password"]);
});

test("throttle service returns not-throttled when block has expired", async () => {
  const repository = new InMemoryRegistrationThrottleRepository();
  const service = new RegistrationThrottleService(repository);

  await repository.save({
    clientKey: "client-a",
    windowStart: new Date("2026-02-09T12:00:00.000Z"),
    failedAttemptCount: 5,
    blockedUntil: new Date("2026-02-09T12:09:59.000Z")
  });

  const result = await service.isThrottled(
    "client-a",
    new Date("2026-02-09T12:10:00.000Z")
  );

  assert.deepEqual(result, { throttled: false, retryAfterSeconds: 0 });
});

test("public route policy throws for non-public route", () => {
  assert.throws(
    () => assertPublicRegistrationRoute("/api/private/registrations"),
    /Route must remain public/
  );
});

test("request context builder handles undefined ip and user agent", () => {
  assert.equal(buildClientKey(undefined, undefined), "unknown|unknown");

  const context = extractRequestContext(
    {
      id: "req_1",
      ip: "127.0.0.1",
      headers: { "user-agent": ["array-agent"] }
    } as unknown as Parameters<typeof extractRequestContext>[0],
    () => new Date("2026-02-09T12:00:00.000Z")
  );

  assert.equal(context.requestId, "req_1");
  assert.equal(context.clientKey, "127.0.0.1|unknown-user-agent");
});

test("sensitive data policy redacts password fields recursively", () => {
  const redacted = redactSensitive({
    password: "Secret123",
    nested: { passwordHash: "hash-value", keep: "ok" },
    entries: [{ password: "another" }, "plain"]
  });

  assert.deepEqual(redacted, {
    password: "[REDACTED]",
    nested: { passwordHash: "[REDACTED]", keep: "ok" },
    entries: [{ password: "[REDACTED]" }, "plain"]
  });
});

test("argon2 hasher verifies true for correct password and false for incorrect", async () => {
  const hasher = new Argon2PasswordHasher();
  const hash = await hasher.hash("Passw0rd88");

  const correct = await hasher.verify(hash, "Passw0rd88");
  const incorrect = await hasher.verify(hash, "WrongPass123");

  assert.equal(correct, true);
  assert.equal(incorrect, false);
});

test("registration logger factory returns usable logger", () => {
  const logger = createRegistrationLogger();
  logger.info({ event: "unit_test", password: "Secret123" });
  assert.equal(typeof logger.info, "function");
});

test("registration telemetry emits logger and throttled metric paths", () => {
  const outcomes: string[] = [];
  let throttledIncrements = 0;
  const emitted: Array<Record<string, unknown>> = [];
  const logged: Array<Record<string, unknown>> = [];

  const telemetry = createRegistrationTelemetry({
    metrics: {
      incrementOutcome: (outcome) => outcomes.push(outcome),
      incrementThrottled: () => {
        throttledIncrements += 1;
      }
    },
    emit: (entry) => emitted.push(entry),
    logger: {
      info: (entry: Record<string, unknown>) => {
        logged.push(entry);
      }
    } as unknown as ReturnType<typeof createRegistrationLogger>
  });

  telemetry.record({
    requestId: "req_telemetry",
    clientKey: "client|ua",
    outcome: "THROTTLED",
    details: { password: "Secret123" }
  });

  assert.deepEqual(outcomes, ["THROTTLED"]);
  assert.equal(throttledIncrements, 1);
  assert.equal(emitted.length, 1);
  assert.equal(logged.length, 1);
  assert.equal(JSON.stringify(emitted[0]).includes("Secret123"), false);
});

test("register user maps unknown processing exceptions to PROCESSING_FAILURE", async () => {
  const telemetryEvents: string[] = [];
  const throttleService = new RegistrationThrottleService(
    new InMemoryRegistrationThrottleRepository()
  );

  const userRepository: UserAccountRepository = {
    findByNormalizedEmail: async () => null,
    createAccount: async () => {
      throw new Error("database down");
    }
  };

  const useCase = new RegisterUserUseCase({
    userRepository,
    throttleService,
    telemetry: {
      record: (event) => {
        telemetryEvents.push(event.outcome);
      }
    },
    passwordHasher: {
      hash: async () => "hashed",
      verify: async () => true
    }
  });

  const result = await useCase.execute({
    fullName: "Alex",
    email: "alex@example.com",
    password: "Passw0rd88",
    requestId: "req_failure",
    clientKey: "127.0.0.1|agent"
  });

  assert.deepEqual(result, { outcome: "PROCESSING_FAILURE" });
  assert.deepEqual(telemetryEvents, ["PROCESSING_FAILURE"]);
});

test("register user maps create collision exceptions to DUPLICATE_EMAIL", async () => {
  const throttleService = new RegistrationThrottleService(
    new InMemoryRegistrationThrottleRepository()
  );

  const userRepository: UserAccountRepository = {
    findByNormalizedEmail: async () => null,
    createAccount: async () => {
      throw new EmailAlreadyRegisteredError();
    }
  };

  const useCase = new RegisterUserUseCase({
    userRepository,
    throttleService,
    telemetry: {
      record: () => {
        // no-op
      }
    },
    passwordHasher: {
      hash: async () => "hashed",
      verify: async () => true
    }
  });

  const result = await useCase.execute({
    fullName: "Alex",
    email: "alex@example.com",
    password: "Passw0rd88",
    requestId: "req_duplicate",
    clientKey: "127.0.0.1|agent"
  });

  assert.deepEqual(result, { outcome: "DUPLICATE_EMAIL" });
});
