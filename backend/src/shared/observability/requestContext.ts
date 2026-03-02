import type { FastifyRequest } from "fastify";

export interface RequestContext {
  requestId: string;
  clientKey: string;
  now: Date;
}

export function buildClientKey(ip: string | undefined, userAgent: string | undefined): string {
  const normalizedIp = (ip ?? "unknown").trim();
  const normalizedUserAgent = (userAgent ?? "unknown").trim().toLowerCase();
  return `${normalizedIp}|${normalizedUserAgent}`;
}

export function extractRequestContext(
  request: FastifyRequest,
  nowProvider: () => Date = () => new Date()
): RequestContext {
  const userAgentHeader = request.headers["user-agent"];
  const userAgent =
    typeof userAgentHeader === "string" ? userAgentHeader : "unknown-user-agent";

  return {
    requestId: request.id,
    clientKey: buildClientKey(request.ip, userAgent),
    now: nowProvider()
  };
}
