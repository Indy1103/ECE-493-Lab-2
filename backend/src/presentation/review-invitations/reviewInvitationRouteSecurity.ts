import type { FastifyReply, FastifyRequest } from "fastify";

export async function requireReviewInvitationTransportSecurity(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const forwardedProto = request.headers["x-forwarded-proto"];

  if (forwardedProto === "https") {
    return;
  }

  reply.code(426).send({
    code: "TLS_REQUIRED",
    message: "HTTPS is required for review invitation actions."
  });
}
