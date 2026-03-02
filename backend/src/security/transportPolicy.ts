import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireRefereeAccessTls(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.headers["x-forwarded-proto"] === "https") {
    return;
  }

  reply.code(426).send({
    messageCode: "TLS_REQUIRED",
    message: "HTTPS is required for assigned paper access."
  });
}
