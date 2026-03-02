import { z } from "zod";

export const LoginRequestSchema = z
  .object({
    username: z.string().trim().min(1),
    password: z.string().min(1)
  })
  .strict();

export const LoginSuccessResponseSchema = z.object({
  state: z.literal("AUTHENTICATED"),
  message: z.string(),
  roleHomePath: z.string(),
  requestId: z.string()
});

export const InvalidCredentialsResponseSchema = z.object({
  code: z.literal("INVALID_CREDENTIALS"),
  message: z.string(),
  requestId: z.string()
});

export const RoleMappingDeniedResponseSchema = z.object({
  code: z.literal("ROLE_MAPPING_UNAVAILABLE"),
  message: z.string(),
  requestId: z.string()
});

export const ThrottledLoginResponseSchema = z.object({
  code: z.literal("LOGIN_THROTTLED"),
  message: z.string(),
  retryAfterSeconds: z.number().int().positive(),
  requestId: z.string()
});

export const AuthenticationUnavailableResponseSchema = z.object({
  code: z.literal("AUTHENTICATION_UNAVAILABLE"),
  message: z.string(),
  requestId: z.string()
});

export const TlsRequiredLoginResponseSchema = z.object({
  code: z.literal("TLS_REQUIRED"),
  message: z.string(),
  requestId: z.string()
});
