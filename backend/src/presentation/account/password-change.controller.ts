import type { FastifyPluginAsync } from "fastify";

import type { ChangePasswordService } from "../../business/account/change-password.service.js";
import type { SessionAuthenticatedRequest } from "../middleware/session-auth.js";
import { transportSecurityGuard } from "../middleware/transportSecurityGuard.js";
import { extractRequestContext } from "../../shared/observability/requestContext.js";
import {
  PasswordChangeErrorResponseSchema,
  PasswordChangeSuccessResponseSchema,
  PasswordChangeValidationErrorResponseSchema
} from "../../business/validation/password-change.schema.js";

interface PasswordChangeRouteDeps {
  changePasswordService: Pick<ChangePasswordService, "execute">;
  sessionAuthMiddleware: (request: SessionAuthenticatedRequest, reply: any) => Promise<void>;
  nowProvider?: () => Date;
}

export function createPasswordChangeRoute(deps: PasswordChangeRouteDeps): FastifyPluginAsync {
  return async function passwordChangeRoute(fastify): Promise<void> {
    fastify.post(
      "/api/v1/account/password-change",
      {
        preHandler: [transportSecurityGuard, deps.sessionAuthMiddleware]
      },
      async (request, reply) => {
        const authenticatedRequest = request as SessionAuthenticatedRequest;
        const context = extractRequestContext(request, deps.nowProvider);
        reply.header("x-request-id", context.requestId);

        if (!authenticatedRequest.auth) {
          reply.code(401).send(
            PasswordChangeErrorResponseSchema.parse({
              code: "SESSION_INVALID",
              message: "Session is invalid or expired."
            })
          );
          return;
        }

        const forwardedFor = request.headers["x-forwarded-for"];
        const sourceIp =
          typeof forwardedFor === "string" && forwardedFor.trim().length > 0
            ? forwardedFor.split(",")[0]!.trim()
            : request.ip;

        const body = (request.body as Record<string, unknown> | undefined) ?? {};
        const outcome = await deps.changePasswordService.execute({
          accountId: authenticatedRequest.auth.accountId,
          sessionId: authenticatedRequest.auth.sessionId,
          sourceIp,
          requestId: context.requestId,
          currentPassword: String(body.currentPassword ?? ""),
          newPassword: String(body.newPassword ?? ""),
          confirmNewPassword: String(body.confirmNewPassword ?? "")
        });

        switch (outcome.outcome) {
          case "SUCCESS": {
            reply.code(200).send(
              PasswordChangeSuccessResponseSchema.parse({
                message: outcome.message,
                reauthenticationRequired: true
              })
            );
            return;
          }
          case "VALIDATION_FAILED": {
            reply.code(400).send(
              PasswordChangeValidationErrorResponseSchema.parse({
                code: "VALIDATION_FAILED",
                message: outcome.message,
                violations: outcome.violations
              })
            );
            return;
          }
          case "THROTTLED": {
            reply.header("Retry-After", String(outcome.retryAfterSeconds));
            reply.code(429).send(
              PasswordChangeErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message,
                retryAfterSeconds: outcome.retryAfterSeconds
              })
            );
            return;
          }
          case "CONFLICT": {
            reply.code(409).send(
              PasswordChangeErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message
              })
            );
            return;
          }
          default: {
            reply.code(500).send(
              PasswordChangeErrorResponseSchema.parse({
                code: "PASSWORD_CHANGE_UNAVAILABLE",
                message: "Password change is temporarily unavailable. Please try again."
              })
            );
          }
        }
      }
    );
  };
}
