import { z } from "zod";

const passwordCompositionRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const RegistrationRequestSchema = z
  .object({
    fullName: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().regex(passwordCompositionRegex)
  })
  .strict();

export const RegistrationSuccessResponseSchema = z.object({
  state: z.literal("REGISTERED"),
  message: z.string()
});

export const ValidationErrorResponseSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  errors: z.array(
    z.object({
      field: z.enum(["fullName", "email", "password"]),
      rule: z.string(),
      message: z.string()
    })
  )
});

export const DuplicateEmailResponseSchema = z.object({
  code: z.literal("EMAIL_ALREADY_REGISTERED"),
  message: z.string()
});

export const RegistrationThrottledResponseSchema = z.object({
  code: z.literal("REGISTRATION_THROTTLED"),
  message: z.string(),
  retryAfterSeconds: z.number().int().positive()
});

export const RegistrationUnavailableResponseSchema = z.object({
  code: z.literal("REGISTRATION_UNAVAILABLE"),
  message: z.string(),
  requestId: z.string()
});

export const TransportSecurityErrorSchema = z.object({
  code: z.literal("TLS_REQUIRED"),
  message: z.string(),
  requestId: z.string()
});
