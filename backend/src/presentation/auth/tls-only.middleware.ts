import type { FastifyReply, FastifyRequest } from "fastify";

import { TlsRequiredLoginResponseSchema } from "../../business/auth/login.schemas.js";

export async function tlsOnlyLoginMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426);
  reply.send(
    TlsRequiredLoginResponseSchema.parse({
      code: "TLS_REQUIRED",
      message: "HTTPS is required for login requests.",
      requestId: request.id
    })
  );
}
