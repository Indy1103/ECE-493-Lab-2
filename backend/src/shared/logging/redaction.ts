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
