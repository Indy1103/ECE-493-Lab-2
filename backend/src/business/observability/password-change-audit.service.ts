export interface PasswordChangeAuditEvent {
  timestamp: string;
  accountId: string;
  sourceIp: string;
  sessionId: string | null;
  outcome: "SUCCESS" | "VALIDATION_FAILED" | "THROTTLED" | "OPERATIONAL_FAILED" | "CONFLICT";
  reasonCode: string;
  requestId: string;
}

export interface PasswordChangeAuditService {
  recordAttempt(event: PasswordChangeAuditEvent): Promise<void>;
  snapshot(): PasswordChangeAuditEvent[];
  restore(snapshot: PasswordChangeAuditEvent[]): void;
  getEvents(): PasswordChangeAuditEvent[];
}

interface PasswordChangeAuditServiceOptions {
  emit?: (event: PasswordChangeAuditEvent) => void;
  forceFailure?: boolean;
}

export function createPasswordChangeAuditService(
  options: PasswordChangeAuditServiceOptions = {}
): PasswordChangeAuditService {
  const events: PasswordChangeAuditEvent[] = [];

  return {
    async recordAttempt(event: PasswordChangeAuditEvent): Promise<void> {
      if (options.forceFailure) {
        throw new Error("forced audit failure");
      }
      events.push(event);
      options.emit?.(event);
    },
    snapshot(): PasswordChangeAuditEvent[] {
      return events.map((event) => ({ ...event }));
    },
    restore(snapshot: PasswordChangeAuditEvent[]): void {
      events.length = 0;
      for (const event of snapshot) {
        events.push({ ...event });
      }
    },
    getEvents(): PasswordChangeAuditEvent[] {
      return events;
    }
  };
}
