import type { FastifyPluginAsync } from "fastify";

import { LoginController } from "./login.controller.js";
import { tlsOnlyLoginMiddleware } from "./tls-only.middleware.js";
import type { LoginFailureUseCase } from "../../business/auth/login-failure.use-case.js";
import type { LoginSuccessUseCase } from "../../business/auth/login-success.use-case.js";
import type { LoginObservability } from "../../shared/observability/login-observability.js";
import type { AuthRepository } from "../../data/auth/auth.repository.js";

interface LoginRoutesDeps {
  successUseCase: Pick<LoginSuccessUseCase, "execute">;
  failureUseCase: Pick<
    LoginFailureUseCase,
    "checkThrottle" | "registerFailedAttempt" | "clearFailedAttempts"
  >;
  observability: LoginObservability;
  repository: Pick<AuthRepository, "recordAttempt">;
  nowProvider?: () => Date;
}

export function createLoginRoutes(deps: LoginRoutesDeps): FastifyPluginAsync {
  return async function loginRoutes(fastify): Promise<void> {
    const controller = new LoginController({
      successUseCase: deps.successUseCase,
      failureUseCase: deps.failureUseCase,
      observability: deps.observability,
      repository: deps.repository,
      nowProvider: deps.nowProvider
    });

    fastify.post(
      "/api/public/login",
      { preHandler: tlsOnlyLoginMiddleware },
      controller.handle.bind(controller)
    );
  };
}
