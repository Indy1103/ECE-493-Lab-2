import { z } from "zod";

export const PasswordChangeRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(12).max(128),
    confirmNewPassword: z.string().min(1)
  })
  .strict();

export const PasswordChangeSuccessResponseSchema = z.object({
  message: z.string(),
  reauthenticationRequired: z.literal(true)
});

export const PasswordChangeViolationSchema = z.object({
  field: z.string(),
  rule: z.string(),
  message: z.string()
});

export const PasswordChangeValidationErrorResponseSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  violations: z.array(PasswordChangeViolationSchema)
});

export const PasswordChangeErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryAfterSeconds: z.number().int().positive().optional()
});
