import argon2 from "argon2";
import Fastify, { type FastifyInstance } from "fastify";

import { createPasswordChangeRoute } from "../../src/presentation/account/password-change.controller.js";
import { createSessionAuthMiddleware } from "../../src/presentation/middleware/session-auth.js";
import { PasswordHashService } from "../../src/business/security/password-hash.service.js";
import {
  InMemoryAccountCredentialRepository
} from "../../src/data/account/account-credential.repository.js";
import {
  InMemoryPasswordChangeThrottleRepository
} from "../../src/data/security/password-change-throttle.repository.js";
import {
  InMemorySessionRepository
} from "../../src/data/security/session.repository.js";
import {
  createPasswordChangeAuditService
} from "../../src/business/observability/password-change-audit.service.js";
import { PasswordChangeThrottleService } from "../../src/business/security/password-change-throttle.service.js";
import { PasswordChangeValidationService } from "../../src/business/account/password-change-validation.service.js";
import { SessionRevocationService } from "../../src/business/security/session-revocation.service.js";
import { ChangePasswordService } from "../../src/business/account/change-password.service.js";

export interface PasswordChangeTestAppOptions {
  forceAuditFailure?: boolean;
  forceSessionRevokeFailure?: boolean;
  forceConflict?: boolean;
}

export interface PasswordChangeTestAppContext {
  app: FastifyInstance;
  accountId: string;
  sessionId: string;
  oldPassword: string;
  credentialRepository: InMemoryAccountCredentialRepository;
  sessionRepository: InMemorySessionRepository;
}

export async function createPasswordChangeTestApp(
  options: PasswordChangeTestAppOptions = {}
): Promise<PasswordChangeTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_pwd_change" });

  const accountId = "00000000-0000-4000-8000-000000000401";
  const sessionId = "sess_uc04_001";
  const oldPassword = "Passw0rd88";
  const oldHash = await argon2.hash(oldPassword, { type: argon2.argon2id });

  const credentialRepository = new InMemoryAccountCredentialRepository({
    forceConflict: options.forceConflict ?? false
  });
  await credentialRepository.seedCredential({
    accountId,
    passwordHash: oldHash,
    credentialVersion: 1
  });

  const sessionRepository = new InMemorySessionRepository({
    forceRevokeFailure: options.forceSessionRevokeFailure ?? false
  });
  await sessionRepository.seedSession({
    sessionId,
    accountId,
    status: "ACTIVE"
  });

  const throttleRepository = new InMemoryPasswordChangeThrottleRepository();
  const hashService = new PasswordHashService();
  const validationService = new PasswordChangeValidationService({
    credentialRepository,
    hashService
  });
  const throttleService = new PasswordChangeThrottleService(throttleRepository);
  const auditService = createPasswordChangeAuditService({
    forceFailure: options.forceAuditFailure ?? false
  });
  const sessionRevocationService = new SessionRevocationService({
    sessionRepository
  });

  const changePasswordService = new ChangePasswordService({
    credentialRepository,
    hashService,
    validationService,
    throttleService,
    auditService,
    sessionRevocationService
  });

  app.register(
    createPasswordChangeRoute({
      changePasswordService,
      sessionAuthMiddleware: createSessionAuthMiddleware({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    accountId,
    sessionId,
    oldPassword,
    credentialRepository,
    sessionRepository
  };
}
