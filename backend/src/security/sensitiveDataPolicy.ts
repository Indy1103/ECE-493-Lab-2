const SENSITIVE_FIELDS = new Set(["password", "passwordHash"]);

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry));
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (SENSITIVE_FIELDS.has(key)) {
        return [key, "[REDACTED]"] as const;
      }

      return [key, redactSensitive(entry)] as const;
    });

    return Object.fromEntries(entries);
  }

  return value;
}
