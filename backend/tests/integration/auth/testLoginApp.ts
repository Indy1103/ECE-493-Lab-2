import argon2 from "argon2";
import Fastify, { type FastifyInstance } from "fastify";

import { createLoginRoutes } from "../../../src/presentation/auth/login.routes.js";
import { InMemoryLoginRepository } from "../../../src/data/auth/login.repository.prisma.js";
import { InMemoryLoginThrottleRepository } from "../../../src/data/auth/login-throttle.repository.prisma.js";
import { LoginThrottlePolicy } from "../../../src/business/auth/throttle-policy.js";
import { LoginFailureUseCase } from "../../../src/business/auth/login-failure.use-case.js";
import { LoginSuccessUseCase } from "../../../src/business/auth/login-success.use-case.js";
import { RolePolicyService } from "../../../src/business/auth/role-policy.js";
import { Argon2PasswordVerifier } from "../../../src/security/auth/password-verifier.js";
import { createLoginObservability } from "../../../src/shared/observability/login-observability.js";

interface LoginTestAppOptions {
  forceProcessingFailure?: boolean;
}

export interface LoginTestAppContext {
  app: FastifyInstance;
  repository: InMemoryLoginRepository;
  throttleRepository: InMemoryLoginThrottleRepository;
  telemetryEvents: Array<Record<string, unknown>>;
}

export async function createLoginTestApp(
  options: LoginTestAppOptions = {}
): Promise<LoginTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_login_test" });
  const repository = new InMemoryLoginRepository({
    forceProcessingFailure: options.forceProcessingFailure ?? false
  });
  const throttleRepository = new InMemoryLoginThrottleRepository();

  const passwordHash = await argon2.hash("Passw0rd88", { type: argon2.argon2id });
  await repository.seedAccount({
    id: "00000000-0000-4000-8000-000000000101",
    username: "editor.jane",
    passwordHash,
    role: "EDITOR"
  });
  await repository.seedAccount({
    id: "00000000-0000-4000-8000-000000000102",
    username: "unmapped.role",
    passwordHash,
    role: "UNMAPPED"
  });

  const telemetryEvents: Array<Record<string, unknown>> = [];
  const observability = createLoginObservability({
    emit: (event) => {
      telemetryEvents.push(event);
    }
  });

  const rolePolicy = new RolePolicyService();
  const passwordVerifier = new Argon2PasswordVerifier();
  const throttlePolicy = new LoginThrottlePolicy(throttleRepository);

  const successUseCase = new LoginSuccessUseCase({
    repository,
    passwordVerifier,
    rolePolicy
  });

  const failureUseCase = new LoginFailureUseCase({
    throttlePolicy
  });

  app.register(
    createLoginRoutes({
      successUseCase,
      failureUseCase,
      observability,
      repository
    })
  );

  await app.ready();

  return {
    app,
    repository,
    throttleRepository,
    telemetryEvents
  };
}
