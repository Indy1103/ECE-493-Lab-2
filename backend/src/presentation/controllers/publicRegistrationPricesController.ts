import type { FastifyReply, FastifyRequest } from "fastify";

import type {
  RegistrationPriceService
} from "../../business/services/registrationPriceService.js";
import {
  RegistrationPricesRetrievalFailedResponseSchema,
  RegistrationPricesUnavailableResponseSchema
} from "../http/errorResponses.js";
import { PublishedRegistrationPriceListSchema } from "../../business/validation/registrationPriceValidation.js";

interface CreateGetPublicRegistrationPricesHandlerDeps {
  service: Pick<RegistrationPriceService, "getPublishedRegistrationPrices">;
  logger?: {
    error(entry: Record<string, unknown>): void;
  };
}

const defaultLogger = {
  error: () => {
    // no-op for tests
  }
};

export function createGetPublicRegistrationPricesHandler(
  deps: CreateGetPublicRegistrationPricesHandlerDeps
) {
  return async function getPublicRegistrationPrices(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<unknown> {
    reply.header("x-request-id", request.id);

    try {
      const result = await deps.service.getPublishedRegistrationPrices();

      if (result.state === "UNAVAILABLE") {
        reply.code(404);
        return RegistrationPricesUnavailableResponseSchema.parse({
          code: "REGISTRATION_PRICES_UNAVAILABLE",
          message: result.message
        });
      }

      reply.code(200);
      return PublishedRegistrationPriceListSchema.parse(result.priceList);
    } catch (error) {
      (deps.logger ?? defaultLogger).error({
        requestId: request.id,
        feature: "UC-17",
        message:
          error instanceof Error
            ? error.message
            : "unknown registration price retrieval error"
      });

      reply.code(503);
      return RegistrationPricesRetrievalFailedResponseSchema.parse({
        code: "REGISTRATION_PRICES_RETRIEVAL_FAILED",
        message:
          "Registration prices are temporarily unavailable. Please try again.",
        requestId: request.id
      });
    }
  };
}
