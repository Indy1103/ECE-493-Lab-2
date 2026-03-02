import { redactSensitive } from "../../security/sensitiveDataPolicy.js";

export function redactPasswordChangeLog(payload: Record<string, unknown>): Record<string, unknown> {
  const expanded = redactSensitive(payload) as Record<string, unknown>;
  const entries = Object.entries(expanded).map(([key, value]) => {
    if (key.toLowerCase().includes("password")) {
      return [key, "[REDACTED]"] as const;
    }
    return [key, value] as const;
  });

  return Object.fromEntries(entries);
}

export function redactManuscriptSubmissionLog(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const expanded = redactSensitive(payload) as Record<string, unknown>;
  const entries = Object.entries(expanded).map(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes("manuscript") ||
      normalizedKey.includes("abstract") ||
      normalizedKey.includes("title") ||
      normalizedKey.includes("keyword") ||
      normalizedKey.includes("sha256") ||
      normalizedKey.includes("digest")
    ) {
      return [key, "[REDACTED]"] as const;
    }

    return [key, value] as const;
  });

  return Object.fromEntries(entries);
}

export function redactScheduleEditLog(payload: Record<string, unknown>): Record<string, unknown> {
  const expanded = redactSensitive(payload) as Record<string, unknown>;
  const entries = Object.entries(expanded).map(([key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes("requestpayload") ||
      normalizedKey.includes("schedule") ||
      normalizedKey.includes("session") ||
      normalizedKey.includes("room") ||
      normalizedKey.includes("timeslot")
    ) {
      return [key, "[REDACTED]"] as const;
    }

    return [key, value] as const;
  });

  return Object.fromEntries(entries);
}
