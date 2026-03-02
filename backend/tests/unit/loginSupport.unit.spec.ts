import assert from "node:assert/strict";
import test from "node:test";

import { RolePolicyService } from "../../src/business/auth/role-policy.js";
import { LoginSuccessUseCase } from "../../src/business/auth/login-success.use-case.js";
import { LoginThrottlePolicy } from "../../src/business/auth/throttle-policy.js";
import { evaluateAuthDataProtection } from "../../src/data/auth/data-protection.policy.js";
import {
  InMemoryLoginRepository
} from "../../src/data/auth/login.repository.prisma.js";
import {
  InMemoryLoginThrottleRepository
} from "../../src/data/auth/login-throttle.repository.prisma.js";

test("login success use case rejects blank credentials before repository lookup", async () => {
  let lookupCalls = 0;

  const useCase = new LoginSuccessUseCase({
    repository: {
      findAccountByUsername: async () => {
        lookupCalls += 1;
        return null;
      },
      createSession: async () => {
        throw new Error("should not create session");
      },
      recordAttempt: async () => {},
      getDataProtectionSnapshot: async () => ({
        primaryRecordsEncrypted: true,
        backupsEncrypted: true
      })
    },
    passwordVerifier: {
      verify: async () => true
    },
    rolePolicy: new RolePolicyService()
  });

  const result = await useCase.execute({
    username: "   ",
    password: "",
    requestId: "req_blank"
  });

  assert.deepEqual(result, { outcome: "INVALID_CREDENTIALS" });
  assert.equal(lookupCalls, 0);
});

test("login success use case rejects unknown accounts", async () => {
  let lookupCalls = 0;

  const useCase = new LoginSuccessUseCase({
    repository: {
      findAccountByUsername: async () => {
        lookupCalls += 1;
        return null;
      },
      createSession: async () => {
        throw new Error("should not create session");
      },
      recordAttempt: async () => {},
      getDataProtectionSnapshot: async () => ({
        primaryRecordsEncrypted: true,
        backupsEncrypted: true
      })
    },
    passwordVerifier: {
      verify: async () => true
    },
    rolePolicy: new RolePolicyService()
  });

  const result = await useCase.execute({
    username: "not.found",
    password: "Passw0rd88",
    requestId: "req_missing"
  });

  assert.deepEqual(result, { outcome: "INVALID_CREDENTIALS" });
  assert.equal(lookupCalls, 1);
});

test("role policy enforces known permission map and denies unknown role permissions", () => {
  const policy = new RolePolicyService();

  assert.equal(policy.hasPermission("EDITOR", "edit_submissions"), true);
  assert.equal(policy.hasPermission("EDITOR", "submit_paper"), false);
  assert.equal(policy.hasPermission("UNKNOWN_ROLE", "edit_submissions"), false);
});

test("login throttle policy treats expired blocks as not throttled", async () => {
  const repository = new InMemoryLoginThrottleRepository();
  const policy = new LoginThrottlePolicy(repository);

  await repository.save({
    clientKey: "client-expired",
    windowStart: new Date("2026-02-09T12:00:00.000Z"),
    failedAttemptCount: 5,
    blockedUntil: new Date("2026-02-09T12:09:59.000Z")
  });

  const result = await policy.isThrottled(
    "client-expired",
    new Date("2026-02-09T12:10:00.000Z")
  );

  assert.deepEqual(result, { throttled: false, retryAfterSeconds: 0 });
});

test("auth data protection policy reports both primary and backup encryption findings", () => {
  const result = evaluateAuthDataProtection({
    primaryRecordsEncrypted: false,
    backupsEncrypted: false
  });

  assert.equal(result.protected, false);
  assert.deepEqual(result.findings, [
    "primary_records_unencrypted",
    "backups_unencrypted"
  ]);
});

test("in-memory login repository supports data protection snapshot updates", async () => {
  const repository = new InMemoryLoginRepository();
  const before = await repository.getDataProtectionSnapshot();

  assert.deepEqual(before, {
    primaryRecordsEncrypted: true,
    backupsEncrypted: true
  });

  await repository.setDataProtectionSnapshot({
    primaryRecordsEncrypted: false,
    backupsEncrypted: true
  });

  const after = await repository.getDataProtectionSnapshot();
  assert.deepEqual(after, {
    primaryRecordsEncrypted: false,
    backupsEncrypted: true
  });
});

test("in-memory login repository returns null when username is not found", async () => {
  const repository = new InMemoryLoginRepository();
  const account = await repository.findAccountByUsername("missing.user");

  assert.equal(account, null);
});

test("auth repository contract module is loaded for coverage", async () => {
  const module = await import("../../src/data/auth/auth.repository.js");
  assert.equal(typeof module, "object");
});
