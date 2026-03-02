import assert from "node:assert/strict";
import test from "node:test";

import argon2 from "argon2";
import Fastify from "fastify";
import request from "supertest";
import { Registry } from "prom-client";

import {
  PasswordChangeRequestSchema
} from "../../src/business/validation/password-change.schema.js";
import { PasswordHashService } from "../../src/business/security/password-hash.service.js";
import {
  InMemoryAccountCredentialRepository
} from "../../src/data/account/account-credential.repository.js";
import {
  InMemoryPasswordChangeThrottleRepository
} from "../../src/data/security/password-change-throttle.repository.js";
import { PasswordChangeThrottleService } from "../../src/business/security/password-change-throttle.service.js";
import {
  createPasswordChangeAuditService
} from "../../src/business/observability/password-change-audit.service.js";
import {
  InMemorySessionRepository
} from "../../src/data/security/session.repository.js";
import {
  createSessionAuthMiddleware
} from "../../src/presentation/middleware/session-auth.js";
import { SessionRevocationService } from "../../src/business/security/session-revocation.service.js";
import {
  PasswordChangeValidationService
} from "../../src/business/account/password-change-validation.service.js";
import { mapValidationOutcome } from "../../src/business/account/password-change-validation.service.js";
import { redactPasswordChangeLog } from "../../src/shared/logging/redaction.js";
import { createPasswordChangeMetrics } from "../../src/business/observability/password-change-metrics.js";
import { createPasswordChangeRoute } from "../../src/presentation/account/password-change.controller.js";
import {
  PasswordChangeConflictError,
  PasswordChangeOperationalError,
  PasswordChangeThrottledError,
  PasswordChangeUnauthorizedError,
  PasswordChangeValidationError
} from "../../src/shared/errors/password-change-errors.js";

test("password change request schema is strict", () => {
  const valid = PasswordChangeRequestSchema.safeParse({
    currentPassword: "Passw0rd88",
    newPassword: "NewPassw0rd99!",
    confirmNewPassword: "NewPassw0rd99!"
  });
  assert.equal(valid.success, true);

  const invalid = PasswordChangeRequestSchema.safeParse({
    currentPassword: "Passw0rd88",
    newPassword: "NewPassw0rd99!",
    confirmNewPassword: "NewPassw0rd99!",
    extra: true
  });
  assert.equal(invalid.success, false);
});

test("password hash service hashes and verifies", async () => {
  const service = new PasswordHashService();
  const hash = await service.hash("Passw0rd88");

  assert.equal(await service.verify(hash, "Passw0rd88"), true);
  assert.equal(await service.verify(hash, "WrongPass123"), false);
});

test("account credential repository reports conflict on version mismatch", async () => {
  const repository = new InMemoryAccountCredentialRepository();
  await repository.seedCredential({
    accountId: "a1",
    passwordHash: "hash-1",
    credentialVersion: 2
  });

  const result = await repository.updateCredential({
    accountId: "a1",
    expectedVersion: 1,
    newPasswordHash: "hash-2",
    now: new Date()
  });

  assert.deepEqual(result, { conflict: true });
});

test("account credential repository supports full lifecycle paths", async () => {
  const now = new Date("2026-02-09T12:00:00.000Z");
  const repository = new InMemoryAccountCredentialRepository();

  const missing = await repository.getCredentialState("missing");
  assert.equal(missing, null);

  const conflictOnMissing = await repository.updateCredential({
    accountId: "missing",
    expectedVersion: 1,
    newPasswordHash: "hash-new",
    now
  });
  assert.deepEqual(conflictOnMissing, { conflict: true });

  await repository.seedCredential({
    accountId: "acc-1",
    passwordHash: "hash-1",
    credentialVersion: 1
  });

  const updated = await repository.updateCredential({
    accountId: "acc-1",
    expectedVersion: 1,
    newPasswordHash: "hash-2",
    now
  });
  assert.equal(updated.conflict, false);
  assert.equal(updated.previousPasswordHash, "hash-1");

  await repository.appendPasswordHistory("acc-1", "hash-1", now);
  await repository.appendPasswordHistory("acc-1", "hash-0", now);
  await repository.prunePasswordHistory("acc-1", 1);
  assert.equal(repository.getHistoryByAccount("acc-1").length, 1);

  await repository.recordAttempt({
    id: "attempt-1",
    accountId: "acc-1",
    sessionId: "sess-1",
    sourceIp: "10.0.0.1",
    outcome: "SUCCESS",
    reasonCode: "PASSWORD_CHANGED",
    occurredAt: now,
    requestId: "req-1"
  });
  assert.equal(repository.getAttempts().length, 1);

  const snapshot = repository.snapshot();
  await repository.updateCredential({
    accountId: "acc-1",
    expectedVersion: 2,
    newPasswordHash: "hash-3",
    now
  });
  await repository.appendPasswordHistory("acc-1", "hash-2", now);
  await repository.recordAttempt({
    id: "attempt-2",
    accountId: "acc-1",
    sessionId: "sess-1",
    sourceIp: "10.0.0.1",
    outcome: "VALIDATION_FAILED",
    reasonCode: "VALIDATION_FAILED",
    occurredAt: now,
    requestId: "req-2"
  });

  repository.restore(snapshot);
  const restoredState = await repository.getCredentialState("acc-1");
  assert.equal(restoredState?.passwordHash, "hash-2");
  assert.equal(restoredState?.credentialVersion, 2);
  assert.equal(repository.getHistoryByAccount("acc-1").length, 1);
  assert.equal(repository.getAttempts().length, 1);

  const conflictRepository = new InMemoryAccountCredentialRepository({ forceConflict: true });
  await conflictRepository.seedCredential({
    accountId: "acc-force",
    passwordHash: "hash-1",
    credentialVersion: 1
  });
  const forcedConflict = await conflictRepository.updateCredential({
    accountId: "acc-force",
    expectedVersion: 1,
    newPasswordHash: "hash-2",
    now
  });
  assert.deepEqual(forcedConflict, { conflict: true });
});

test("throttle service blocks after threshold and clears state", async () => {
  const repository = new InMemoryPasswordChangeThrottleRepository();
  const service = new PasswordChangeThrottleService(repository);
  const now = new Date("2026-02-09T12:00:00.000Z");

  for (let index = 0; index < 5; index += 1) {
    await service.recordFailure("acc-1", "10.1.1.1", now);
  }

  const blocked = await service.isThrottled("acc-1", "10.1.1.1", now);
  assert.equal(blocked.throttled, true);
  assert.equal(blocked.retryAfterSeconds > 0, true);

  await service.clearFailures("acc-1", "10.1.1.1");
  const unblocked = await service.isThrottled("acc-1", "10.1.1.1", now);
  assert.deepEqual(unblocked, { throttled: false, retryAfterSeconds: 0 });
});

test("throttle service handles expired locks and null blocked-until snapshots", async () => {
  const repository = new InMemoryPasswordChangeThrottleRepository();
  const service = new PasswordChangeThrottleService(repository);
  const now = new Date("2026-02-09T12:00:00.000Z");

  await repository.save({
    key: "account:acc-1",
    windowStart: new Date(now.getTime() - 60_000),
    failedCount: 5,
    blockedUntil: new Date(now.getTime() - 1_000)
  });
  await repository.save({
    key: "ip:10.0.0.1",
    windowStart: new Date(now.getTime() - 60_000),
    failedCount: 4,
    blockedUntil: null
  });

  const result = await service.isThrottled("acc-1", "10.0.0.1", now);
  assert.deepEqual(result, { throttled: false, retryAfterSeconds: 0 });
  assert.equal((service as any).retryAfterSeconds({ blockedUntil: null }, now), 0);
});

test("audit service supports snapshot and restore", async () => {
  const audit = createPasswordChangeAuditService();

  await audit.recordAttempt({
    timestamp: new Date().toISOString(),
    accountId: "acc-1",
    sourceIp: "10.1.1.1",
    sessionId: "sess-1",
    outcome: "SUCCESS",
    reasonCode: "PASSWORD_CHANGED",
    requestId: "req-1"
  });

  const snapshot = audit.snapshot();

  await audit.recordAttempt({
    timestamp: new Date().toISOString(),
    accountId: "acc-1",
    sourceIp: "10.1.1.1",
    sessionId: "sess-1",
    outcome: "VALIDATION_FAILED",
    reasonCode: "VALIDATION_FAILED",
    requestId: "req-2"
  });

  assert.equal(audit.getEvents().length, 2);
  audit.restore(snapshot);
  assert.equal(audit.getEvents().length, 1);

  const failingAudit = createPasswordChangeAuditService({ forceFailure: true });
  await assert.rejects(
    failingAudit.recordAttempt({
      timestamp: new Date().toISOString(),
      accountId: "acc-1",
      sourceIp: "10.1.1.1",
      sessionId: "sess-1",
      outcome: "SUCCESS",
      reasonCode: "PASSWORD_CHANGED",
      requestId: "req-1"
    })
  );
});

test("audit service invokes emit callback when provided", async () => {
  const emitted: string[] = [];
  const audit = createPasswordChangeAuditService({
    emit: (event) => emitted.push(event.requestId)
  });

  await audit.recordAttempt({
    timestamp: new Date().toISOString(),
    accountId: "acc-1",
    sourceIp: "10.1.1.1",
    sessionId: "sess-1",
    outcome: "SUCCESS",
    reasonCode: "PASSWORD_CHANGED",
    requestId: "req-emit"
  });

  assert.deepEqual(emitted, ["req-emit"]);
});

test("session auth middleware rejects missing and invalid session, accepts active session", async () => {
  const repository = new InMemorySessionRepository();
  await repository.seedSession({
    sessionId: "sess-ok",
    accountId: "acc-1",
    status: "ACTIVE"
  });

  const middleware = createSessionAuthMiddleware({ sessionRepository: repository });

  const requestMissing = { headers: {} } as Parameters<typeof middleware>[0];
  const replyMissing = {
    statusCode: 0,
    body: undefined as unknown,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  await middleware(requestMissing, replyMissing as any);
  assert.equal(replyMissing.statusCode, 401);

  const requestInvalid = {
    headers: { cookie: "cms_session=missing" }
  } as Parameters<typeof middleware>[0];
  const replyInvalid = {
    statusCode: 0,
    body: undefined as unknown,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  await middleware(requestInvalid, replyInvalid as any);
  assert.equal(replyInvalid.statusCode, 401);

  const requestValid = {
    headers: { cookie: "cms_session=sess-ok" }
  } as Parameters<typeof middleware>[0];
  const replyValid = {
    code() {
      return this;
    },
    send() {
      return this;
    }
  };

  await middleware(requestValid, replyValid as any);
  assert.deepEqual((requestValid as any).auth, {
    accountId: "acc-1",
    sessionId: "sess-ok"
  });

  const requestWithCookiePrefix = {
    headers: { cookie: "foo=bar; cms_session=sess-ok" }
  } as Parameters<typeof middleware>[0];
  await middleware(requestWithCookiePrefix, replyValid as any);
  assert.deepEqual((requestWithCookiePrefix as any).auth, {
    accountId: "acc-1",
    sessionId: "sess-ok"
  });

  const requestEmptySession = {
    headers: { cookie: "cms_session=   " }
  } as Parameters<typeof middleware>[0];
  const replyEmpty = {
    statusCode: 0,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send() {
      return this;
    }
  };
  await middleware(requestEmptySession, replyEmpty as any);
  assert.equal(replyEmpty.statusCode, 401);

  const requestNoSessionCookie = {
    headers: { cookie: "theme=dark; locale=en-US" }
  } as Parameters<typeof middleware>[0];
  const replyNoSession = {
    statusCode: 0,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send() {
      return this;
    }
  };
  await middleware(requestNoSessionCookie, replyNoSession as any);
  assert.equal(replyNoSession.statusCode, 401);
});

test("session revocation service delegates revoke and snapshot/restore", async () => {
  const repository = new InMemorySessionRepository();
  await repository.seedSession({
    sessionId: "sess-1",
    accountId: "acc-1",
    status: "ACTIVE"
  });

  const service = new SessionRevocationService({ sessionRepository: repository });
  const snapshot = service.snapshot();
  await service.revokeAll("acc-1", new Date());
  assert.equal(repository.getActiveSessionsByAccount("acc-1").length, 0);
  service.restore(snapshot);
  assert.equal(repository.getActiveSessionsByAccount("acc-1").length, 1);
});

test("session repository handles expire-missing and selective revoke branches", async () => {
  const repository = new InMemorySessionRepository();

  await repository.expireSession("does-not-exist");

  await repository.seedSession({ sessionId: "s1", accountId: "acc-1", status: "ACTIVE" });
  await repository.seedSession({ sessionId: "s2", accountId: "acc-2", status: "ACTIVE" });
  await repository.seedSession({ sessionId: "s3", accountId: "acc-1", status: "EXPIRED" });

  const now = new Date("2026-02-09T12:00:00.000Z");
  await repository.revokeAllByAccount("acc-1", now);

  const s1 = await repository.getSessionById("s1");
  const s2 = await repository.getSessionById("s2");
  const s3 = await repository.getSessionById("s3");

  assert.equal(s1?.status, "REVOKED");
  assert.equal(s2?.status, "ACTIVE");
  assert.equal(s3?.status, "EXPIRED");
});

test("validation service returns violations for mismatch, same password, current mismatch, and reuse", async () => {
  const repository = new InMemoryAccountCredentialRepository();
  const hashService = new PasswordHashService();

  const currentHash = await hashService.hash("Passw0rd88");
  const reusedHash = await hashService.hash("ReusedPassw0rd1!");
  await repository.seedCredential({
    accountId: "acc-1",
    passwordHash: currentHash,
    credentialVersion: 1
  });
  await repository.appendPasswordHistory("acc-1", reusedHash, new Date());

  const service = new PasswordChangeValidationService({ credentialRepository: repository, hashService });

  const invalidSchema = await service.validate({
    accountId: "acc-1",
    currentPassword: "",
    newPassword: "short",
    confirmNewPassword: "short"
  });
  assert.equal(invalidSchema.valid, false);

  const mismatch = await service.validate({
    accountId: "acc-1",
    currentPassword: "WrongCurrent1!",
    newPassword: "LongPassw0rd88!",
    confirmNewPassword: "DifferentPass99!"
  });
  assert.equal(mismatch.valid, false);

  const reused = await service.validate({
    accountId: "acc-1",
    currentPassword: "Passw0rd88",
    newPassword: "ReusedPassw0rd1!",
    confirmNewPassword: "ReusedPassw0rd1!"
  });
  assert.equal(reused.valid, false);

  const valid = await service.validate({
    accountId: "acc-1",
    currentPassword: "Passw0rd88",
    newPassword: "BrandNewPassw0rd2!",
    confirmNewPassword: "BrandNewPassw0rd2!"
  });
  assert.equal(valid.valid, true);

  const missingAccount = await service.validate({
    accountId: "missing-account",
    currentPassword: "CurrentPassw0rd1!",
    newPassword: "BrandNewPassw0rd2!",
    confirmNewPassword: "BrandNewPassw0rd2!"
  });
  assert.equal(missingAccount.valid, false);

  const sameAsCurrent = await service.validate({
    accountId: "acc-1",
    currentPassword: "Passw0rd88",
    newPassword: "Passw0rd88",
    confirmNewPassword: "Passw0rd88"
  });
  assert.equal(sameAsCurrent.valid, false);

  const longRepository = new InMemoryAccountCredentialRepository();
  const longCurrentHash = await hashService.hash("CurrentPassw0rd1!");
  await longRepository.seedCredential({
    accountId: "acc-2",
    passwordHash: longCurrentHash,
    credentialVersion: 1
  });
  const longService = new PasswordChangeValidationService({
    credentialRepository: longRepository,
    hashService
  });
  const sameLongPassword = await longService.validate({
    accountId: "acc-2",
    currentPassword: "CurrentPassw0rd1!",
    newPassword: "CurrentPassw0rd1!",
    confirmNewPassword: "CurrentPassw0rd1!"
  });
  assert.equal(sameLongPassword.valid, false);
});

test("validation service maps unknown issue paths to request field", async () => {
  const repository = new InMemoryAccountCredentialRepository();
  const hashService = new PasswordHashService();
  const service = new PasswordChangeValidationService({ credentialRepository: repository, hashService });

  const originalSafeParse = PasswordChangeRequestSchema.safeParse.bind(PasswordChangeRequestSchema);

  (PasswordChangeRequestSchema as any).safeParse = () => ({
    success: false,
    error: {
      issues: [{ path: [], code: "custom", message: "invalid" }]
    }
  });

  try {
    const result = await service.validate({
      accountId: "acc-1",
      currentPassword: "CurrentPassw0rd1!",
      newPassword: "BrandNewPassw0rd2!",
      confirmNewPassword: "BrandNewPassw0rd2!"
    });
    assert.equal(result.valid, false);
    assert.equal(result.violations[0]?.field, "request");
  } finally {
    (PasswordChangeRequestSchema as any).safeParse = originalSafeParse;
  }
});

test("validation outcome mapper returns standard shape", () => {
  const mapped = mapValidationOutcome([
    {
      field: "newPassword",
      rule: "policy",
      message: "bad"
    }
  ]);

  assert.equal(mapped.outcome, "VALIDATION_FAILED");
  assert.equal(mapped.violations.length, 1);
});

test("password change log redaction removes sensitive values", () => {
  const redacted = redactPasswordChangeLog({
    currentPassword: "Passw0rd88",
    newPassword: "NewPassw0rd99!",
    nested: { passwordHash: "hash" }
  });

  assert.deepEqual(redacted, {
    currentPassword: "[REDACTED]",
    newPassword: "[REDACTED]",
    nested: { passwordHash: "[REDACTED]" }
  });
});

test("password change metrics can increment and observe latency", async () => {
  const registry = new Registry();
  const metrics = createPasswordChangeMetrics({ registry });

  metrics.incrementOutcome("SUCCESS");
  metrics.observeLatencyMs(120);

  const rendered = await registry.metrics();
  assert.equal(rendered.includes("password_change_outcomes_total"), true);
  assert.equal(rendered.includes("password_change_latency_ms"), true);
});

test("password change metrics work with default registry", async () => {
  const metrics = createPasswordChangeMetrics();
  metrics.incrementOutcome("SUCCESS");
  metrics.observeLatencyMs(50);
  await Promise.resolve();
});

test("password change controller returns 401 when middleware does not attach auth context", async () => {
  const app = Fastify({ logger: false });

  app.register(
    createPasswordChangeRoute({
      sessionAuthMiddleware: async () => {
        // intentionally no-op
      },
      changePasswordService: {
        execute: async () => ({
          outcome: "SUCCESS",
          message: "ok",
          reauthenticationRequired: true
        })
      }
    })
  );

  await app.ready();

  const response = await request(app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https")
    .send({
      currentPassword: "Passw0rd88",
      newPassword: "NewPassw0rd99!",
      confirmNewPassword: "NewPassw0rd99!"
    });

  assert.equal(response.status, 401);
  assert.equal(response.body.code, "SESSION_INVALID");

  await app.close();
});

test("password change controller maps missing body fields to empty strings", async () => {
  const app = Fastify({ logger: false });

  app.register(
    createPasswordChangeRoute({
      sessionAuthMiddleware: async (request) => {
        request.auth = { accountId: "acc-1", sessionId: "sess-1" };
      },
      changePasswordService: {
        execute: async (input) => {
          assert.equal(input.currentPassword, "");
          assert.equal(input.newPassword, "");
          assert.equal(input.confirmNewPassword, "");
          return {
            outcome: "VALIDATION_FAILED",
            message: "Password change validation failed.",
            violations: []
          };
        }
      }
    })
  );

  await app.ready();

  const response = await request(app.server)
    .post("/api/v1/account/password-change")
    .set("x-forwarded-proto", "https");

  assert.equal(response.status, 400);
  await app.close();
});

test("password change error classes expose names and defaults", () => {
  const validation = new PasswordChangeValidationError([
    { field: "newPassword", rule: "policy", message: "invalid" }
  ]);
  assert.equal(validation.name, "PasswordChangeValidationError");
  assert.equal(validation.violations.length, 1);

  const unauthorizedDefault = new PasswordChangeUnauthorizedError();
  const unauthorizedCustom = new PasswordChangeUnauthorizedError("custom");
  assert.equal(unauthorizedDefault.message, "Session is invalid or expired.");
  assert.equal(unauthorizedCustom.message, "custom");

  const throttled = new PasswordChangeThrottledError(30);
  assert.equal(throttled.retryAfterSeconds, 30);

  const conflictDefault = new PasswordChangeConflictError();
  const conflictCustom = new PasswordChangeConflictError("conflict");
  assert.equal(conflictDefault.message, "Password change conflicted with another update.");
  assert.equal(conflictCustom.message, "conflict");

  const operationalDefault = new PasswordChangeOperationalError();
  const operationalCustom = new PasswordChangeOperationalError("down");
  assert.equal(
    operationalDefault.message,
    "Password change is temporarily unavailable. Please try again."
  );
  assert.equal(operationalCustom.message, "down");
});

test("password change domain module loads for coverage", async () => {
  await import("../../src/business/domain/password-change.js");
});

test("account credential repository returns defaults for missing history", async () => {
  const repository = new InMemoryAccountCredentialRepository();
  assert.deepEqual(repository.getHistoryByAccount("missing"), []);
  await repository.prunePasswordHistory("missing", 5);
  assert.deepEqual(repository.getHistoryByAccount("missing"), []);
});

test("argon2 direct verify sanity for fixture compatibility", async () => {
  const hash = await argon2.hash("Passw0rd88", { type: argon2.argon2id });
  assert.equal(await argon2.verify(hash, "Passw0rd88"), true);
});
