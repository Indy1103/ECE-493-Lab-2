import type { FastifyPluginAsync } from "fastify";

import type { RegistrationPriceService } from "../../business/services/registrationPriceService.js";
import type { SessionAuthenticatedRequest } from "../middleware/session-auth.js";
import { createGetPublicRegistrationPricesHandler } from "../controllers/publicRegistrationPricesController.js";
import { assertRouteIsPublic } from "../middleware/auth.js";
import { transportSecurityGuard } from "../middleware/transportSecurityGuard.js";

export const PUBLIC_REGISTRATION_PRICES_ROUTE = "/public/registration-prices";

export interface PublicRoutesDeps {
  registrationPriceService: Pick<RegistrationPriceService, "getPublishedRegistrationPrices">;
  logger?: {
    error(entry: Record<string, unknown>): void;
  };
}

export function createPublicRoutes(deps: PublicRoutesDeps): FastifyPluginAsync {
  return async function publicRoutes(fastify): Promise<void> {
    assertRouteIsPublic(PUBLIC_REGISTRATION_PRICES_ROUTE);

    const getPublicRegistrationPrices = createGetPublicRegistrationPricesHandler({
      service: deps.registrationPriceService,
      logger: deps.logger
    });

    fastify.get(
      PUBLIC_REGISTRATION_PRICES_ROUTE,
      {
        preHandler: [
          transportSecurityGuard as unknown as (
            request: SessionAuthenticatedRequest,
            reply: unknown
          ) => Promise<void>
        ]
      },
      getPublicRegistrationPrices
    );
  };
}
