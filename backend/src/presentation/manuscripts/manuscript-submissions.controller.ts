import type { FastifyPluginAsync } from "fastify";

import type { SubmitManuscriptService } from "../../business/manuscripts/submit-manuscript.service.js";
import type { AuthorSessionRequest } from "../middleware/author-session-auth.js";
import { ManuscriptErrorResponseSchema, ManuscriptSuccessResponseSchema, ManuscriptValidationErrorResponseSchema } from "../../business/validation/manuscript-submission.schema.js";
import { requireTransportSecurity } from "../middleware/transport-security.js";

interface ManuscriptSubmissionsRouteDeps {
  submitManuscriptService: Pick<SubmitManuscriptService, "getRequirements" | "submit">;
  authorSessionAuth: (request: AuthorSessionRequest, reply: any) => Promise<void>;
}

export function createManuscriptSubmissionsRoute(
  deps: ManuscriptSubmissionsRouteDeps
): FastifyPluginAsync {
  return async function manuscriptSubmissionsRoute(fastify): Promise<void> {
    fastify.get(
      "/api/v1/manuscript-submissions/requirements",
      {
        preHandler: [requireTransportSecurity, deps.authorSessionAuth]
      },
      async (request, reply) => {
        const authorRequest = request as AuthorSessionRequest;
        reply.header("x-request-id", request.id);

        if (!authorRequest.authorAuth) {
          reply.code(401).send(
            ManuscriptErrorResponseSchema.parse({
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required for manuscript submission."
            })
          );
          return;
        }

        const outcome = await deps.submitManuscriptService.getRequirements(authorRequest.authorAuth.authorId);

        if (outcome.outcome === "INTAKE_CLOSED") {
          reply.code(409).send(
            ManuscriptErrorResponseSchema.parse({
              code: "INTAKE_CLOSED",
              message: "Submission intake is closed for the active cycle."
            })
          );
          return;
        }

        reply.code(200).send({
          cycleId: outcome.cycleId,
          intakeStatus: outcome.intakeStatus,
          metadataPolicyVersion: outcome.metadataPolicyVersion,
          requiredMetadataFields: outcome.requiredMetadataFields,
          fileConstraints: outcome.fileConstraints
        });
      }
    );

    fastify.post(
      "/api/v1/manuscript-submissions",
      {
        preHandler: [requireTransportSecurity, deps.authorSessionAuth]
      },
      async (request, reply) => {
        const authorRequest = request as AuthorSessionRequest;
        reply.header("x-request-id", request.id);

        if (!authorRequest.authorAuth) {
          reply.code(401).send(
            ManuscriptErrorResponseSchema.parse({
              code: "AUTHENTICATION_REQUIRED",
              message: "Authentication is required for manuscript submission."
            })
          );
          return;
        }

        const forwardedFor = request.headers["x-forwarded-for"];
        const sourceIp =
          typeof forwardedFor === "string" && forwardedFor.trim().length > 0
            ? forwardedFor.split(",")[0]!.trim()
            : request.ip;

        const outcome = await deps.submitManuscriptService.submit({
          authorId: authorRequest.authorAuth.authorId,
          requestId: request.id,
          sourceIp,
          body: (request.body as Record<string, unknown> | undefined) ?? {}
        });

        switch (outcome.outcome) {
          case "SUCCESS": {
            reply.code(201).send(
              ManuscriptSuccessResponseSchema.parse({
                submissionId: outcome.submissionId,
                status: outcome.status,
                message: outcome.message
              })
            );
            return;
          }
          case "VALIDATION_FAILED": {
            reply.code(400).send(
              ManuscriptValidationErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message,
                violations: outcome.violations
              })
            );
            return;
          }
          case "INTAKE_CLOSED": {
            reply.code(409).send(
              ManuscriptErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message
              })
            );
            return;
          }
          case "DUPLICATE": {
            reply.code(409).send(
              ManuscriptErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message
              })
            );
            return;
          }
          case "FILE_TOO_LARGE": {
            reply.code(413).send(
              ManuscriptErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message
              })
            );
            return;
          }
          case "FILE_TYPE_NOT_ALLOWED": {
            reply.code(415).send(
              ManuscriptErrorResponseSchema.parse({
                code: outcome.code,
                message: outcome.message
              })
            );
            return;
          }
          default: {
            reply.code(500).send(
              ManuscriptErrorResponseSchema.parse({
                code: "OPERATIONAL_FAILURE",
                message: "Submission could not be completed. Please retry."
              })
            );
          }
        }
      }
    );
  };
}
