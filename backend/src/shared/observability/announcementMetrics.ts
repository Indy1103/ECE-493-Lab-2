import { Counter, Registry } from "prom-client";

export interface AnnouncementMetrics {
  incrementRetrievalFailure(reason: string): void;
}

export function createAnnouncementMetrics(
  registry: Registry = new Registry()
): AnnouncementMetrics {
  const retrievalFailures = new Counter({
    name: "public_announcements_retrieval_failures_total",
    help: "Count of public announcement retrieval failures",
    labelNames: ["reason"],
    registers: [registry]
  });

  return {
    incrementRetrievalFailure(reason: string): void {
      retrievalFailures.inc({ reason });
    }
  };
}
