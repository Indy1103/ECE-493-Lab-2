import type { FastifyReply, FastifyRequest } from "fastify";

import { REGISTRATION_MESSAGES } from "../registration/errorMessageCatalog.js";
import { TransportSecurityErrorSchema } from "../registration/registrationSchemas.js";

export async function transportSecurityGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const forwardedProto = request.headers["x-forwarded-proto"];

  if (forwardedProto === "https") {
    return;
  }

  reply.code(426);
  reply.send(
    TransportSecurityErrorSchema.parse({
      code: "TLS_REQUIRED",
      message: REGISTRATION_MESSAGES.TLS_REQUIRED,
      requestId: request.id
    })
  );
}
