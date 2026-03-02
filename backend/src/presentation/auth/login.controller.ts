import { randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";

import {
  AuthenticationUnavailableResponseSchema,
  InvalidCredentialsResponseSchema,
  LoginRequestSchema,
  LoginSuccessResponseSchema,
  RoleMappingDeniedResponseSchema,
  ThrottledLoginResponseSchema
} from "../../business/auth/login.schemas.js";
import { LOGIN_MESSAGES } from "../../business/auth/login-error-mapper.js";
import { extractRequestContext } from "../../shared/observability/requestContext.js";
import type { LoginFailureUseCase } from "../../business/auth/login-failure.use-case.js";
import type { LoginSuccessUseCase } from "../../business/auth/login-success.use-case.js";
import type { LoginObservability } from "../../shared/observability/login-observability.js";
import type { AuthRepository } from "../../data/auth/auth.repository.js";

interface LoginControllerDeps {
  successUseCase: Pick<LoginSuccessUseCase, "execute">;
  failureUseCase: Pick<
    LoginFailureUseCase,
    "checkThrottle" | "registerFailedAttempt" | "clearFailedAttempts"
  >;
  observability: LoginObservability;
  repository: Pick<AuthRepository, "recordAttempt">;
  nowProvider?: () => Date;
}

export class LoginController {
  private readonly nowProvider: () => Date;

  constructor(private readonly deps: LoginControllerDeps) {
    this.nowProvider = deps.nowProvider ?? (() => new Date());
  }

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const context = extractRequestContext(request, this.nowProvider);
    reply.header("x-request-id", context.requestId);

    const throttle = await this.deps.failureUseCase.checkThrottle(
      context.clientKey,
      context.now
    );

    if (throttle.throttled) {
      await this.deps.repository.recordAttempt({
        attemptId: randomUUID(),
        usernameSubmitted: "THROTTLED",
        attemptedAt: context.now,
        clientKey: context.clientKey,
        outcome: "THROTTLED",
        requestId: context.requestId
      });

      this.deps.observability.record({
        requestId: context.requestId,
        clientKey: context.clientKey,
        username: "THROTTLED",
        outcome: "THROTTLED",
        details: { retryAfterSeconds: throttle.retryAfterSeconds }
      });

      reply.code(429).send(
        ThrottledLoginResponseSchema.parse({
          code: "LOGIN_THROTTLED",
          message: LOGIN_MESSAGES.LOGIN_THROTTLED,
          retryAfterSeconds: throttle.retryAfterSeconds,
          requestId: context.requestId
        })
      );
      return;
    }

    const parsedBody = LoginRequestSchema.safeParse(
      (request.body as Record<string, unknown> | undefined) ?? {}
    );

    if (!parsedBody.success) {
      await this.deps.failureUseCase.registerFailedAttempt(context.clientKey, context.now);
      await this.deps.repository.recordAttempt({
        attemptId: randomUUID(),
        usernameSubmitted: "",
        attemptedAt: context.now,
        clientKey: context.clientKey,
        outcome: "INVALID_CREDENTIALS",
        requestId: context.requestId
      });
      this.deps.observability.record({
        requestId: context.requestId,
        clientKey: context.clientKey,
        username: "",
        outcome: "INVALID_CREDENTIALS"
      });

      reply.code(401).send(
        InvalidCredentialsResponseSchema.parse({
          code: "INVALID_CREDENTIALS",
          message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
          requestId: context.requestId
        })
      );
      return;
    }

    const success = await this.deps.successUseCase.execute({
      username: parsedBody.data.username,
      password: parsedBody.data.password,
      requestId: context.requestId
    });

    if (success.outcome === "AUTHENTICATED") {
      await this.deps.failureUseCase.clearFailedAttempts(context.clientKey);
      await this.deps.repository.recordAttempt({
        attemptId: randomUUID(),
        usernameSubmitted: parsedBody.data.username,
        attemptedAt: context.now,
        clientKey: context.clientKey,
        outcome: "AUTHENTICATED",
        requestId: context.requestId
      });
      this.deps.observability.record({
        requestId: context.requestId,
        clientKey: context.clientKey,
        username: parsedBody.data.username,
        outcome: "AUTHENTICATED"
      });

      reply.code(200).send(
        LoginSuccessResponseSchema.parse({
          state: "AUTHENTICATED",
          message: LOGIN_MESSAGES.AUTHENTICATED,
          roleHomePath: success.roleHomePath,
          requestId: context.requestId
        })
      );
      return;
    }

    if (success.outcome === "INVALID_CREDENTIALS") {
      await this.deps.failureUseCase.registerFailedAttempt(context.clientKey, context.now);
      await this.deps.repository.recordAttempt({
        attemptId: randomUUID(),
        usernameSubmitted: parsedBody.data.username,
        attemptedAt: context.now,
        clientKey: context.clientKey,
        outcome: "INVALID_CREDENTIALS",
        requestId: context.requestId
      });
      this.deps.observability.record({
        requestId: context.requestId,
        clientKey: context.clientKey,
        username: parsedBody.data.username,
        outcome: "INVALID_CREDENTIALS"
      });

      reply.code(401).send(
        InvalidCredentialsResponseSchema.parse({
          code: "INVALID_CREDENTIALS",
          message: LOGIN_MESSAGES.INVALID_CREDENTIALS,
          requestId: context.requestId
        })
      );
      return;
    }

    if (success.outcome === "ROLE_MAPPING_UNAVAILABLE") {
      await this.deps.repository.recordAttempt({
        attemptId: randomUUID(),
        usernameSubmitted: parsedBody.data.username,
        attemptedAt: context.now,
        clientKey: context.clientKey,
        outcome: "ROLE_MAPPING_UNAVAILABLE",
        requestId: context.requestId
      });
      this.deps.observability.record({
        requestId: context.requestId,
        clientKey: context.clientKey,
        username: parsedBody.data.username,
        outcome: "ROLE_MAPPING_UNAVAILABLE"
      });

      reply.code(403).send(
        RoleMappingDeniedResponseSchema.parse({
          code: "ROLE_MAPPING_UNAVAILABLE",
          message: LOGIN_MESSAGES.ROLE_MAPPING_UNAVAILABLE,
          requestId: context.requestId
        })
      );
      return;
    }

    await this.deps.repository.recordAttempt({
      attemptId: randomUUID(),
      usernameSubmitted: parsedBody.data.username,
      attemptedAt: context.now,
      clientKey: context.clientKey,
      outcome: "PROCESSING_FAILURE",
      requestId: context.requestId
    });
    this.deps.observability.record({
      requestId: context.requestId,
      clientKey: context.clientKey,
      username: parsedBody.data.username,
      outcome: "PROCESSING_FAILURE"
    });

    reply.code(503).send(
      AuthenticationUnavailableResponseSchema.parse({
        code: "AUTHENTICATION_UNAVAILABLE",
        message: LOGIN_MESSAGES.AUTHENTICATION_UNAVAILABLE,
        requestId: context.requestId
      })
    );
  }
}
