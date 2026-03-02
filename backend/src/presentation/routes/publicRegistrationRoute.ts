import type { FastifyPluginAsync } from "fastify";

import { extractRequestContext } from "../../shared/observability/requestContext.js";
import { REGISTRATION_MESSAGES } from "../registration/errorMessageCatalog.js";
import {
  DuplicateEmailResponseSchema,
  RegistrationSuccessResponseSchema,
  RegistrationThrottledResponseSchema,
  RegistrationUnavailableResponseSchema,
  ValidationErrorResponseSchema
} from "../registration/registrationSchemas.js";
import { assertPublicRegistrationRoute, PUBLIC_REGISTRATION_ROUTE } from "./publicRoutePolicy.js";
import { transportSecurityGuard } from "../middleware/transportSecurityGuard.js";
import type { RegisterUserUseCase } from "../../business/registration/registerUser.js";

interface PublicRegistrationRouteDeps {
  registerUser: Pick<RegisterUserUseCase, "execute">;
  nowProvider?: () => Date;
}

export function createPublicRegistrationRoute(
  deps: PublicRegistrationRouteDeps
): FastifyPluginAsync {
  return async function publicRegistrationRoute(fastify): Promise<void> {
    assertPublicRegistrationRoute(PUBLIC_REGISTRATION_ROUTE);

    fastify.post(
      PUBLIC_REGISTRATION_ROUTE,
      { preHandler: transportSecurityGuard },
      async (request, reply) => {
        const context = extractRequestContext(request, deps.nowProvider);
        reply.header("x-request-id", context.requestId);

        const body = request.body as Partial<{
          fullName: string;
          email: string;
          password: string;
        }>;

        const outcome = await deps.registerUser.execute({
          fullName: body.fullName ?? "",
          email: body.email ?? "",
          password: body.password ?? "",
          requestId: context.requestId,
          clientKey: context.clientKey
        });

        switch (outcome.outcome) {
          case "REGISTERED": {
            reply.code(201);
            return RegistrationSuccessResponseSchema.parse({
              state: "REGISTERED",
              message: REGISTRATION_MESSAGES.REGISTERED
            });
          }
          case "VALIDATION_FAILED": {
            reply.code(400);
            return ValidationErrorResponseSchema.parse({
              code: "VALIDATION_FAILED",
              message: REGISTRATION_MESSAGES.VALIDATION_FAILED,
              errors: outcome.errors
            });
          }
          case "DUPLICATE_EMAIL": {
            reply.code(409);
            return DuplicateEmailResponseSchema.parse({
              code: "EMAIL_ALREADY_REGISTERED",
              message: REGISTRATION_MESSAGES.DUPLICATE_EMAIL
            });
          }
          case "THROTTLED": {
            reply.code(429);
            return RegistrationThrottledResponseSchema.parse({
              code: "REGISTRATION_THROTTLED",
              message: REGISTRATION_MESSAGES.THROTTLED,
              retryAfterSeconds: outcome.retryAfterSeconds
            });
          }
          default: {
            reply.code(503);
            return RegistrationUnavailableResponseSchema.parse({
              code: "REGISTRATION_UNAVAILABLE",
              message: REGISTRATION_MESSAGES.UNAVAILABLE,
              requestId: context.requestId
            });
          }
        }
      }
    );
  };
}
