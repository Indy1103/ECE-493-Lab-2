import pino, { type Logger } from "pino";

export function createRegistrationLogger(): Logger {
  return pino({
    level: "info",
    redact: {
      paths: [
        "password",
        "passwordHash",
        "body.password",
        "req.body.password",
        "details.password",
        "details.passwordHash"
      ],
      censor: "[REDACTED]"
    }
  });
}
