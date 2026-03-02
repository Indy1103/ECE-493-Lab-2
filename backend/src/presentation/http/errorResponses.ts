import { z } from "zod";

export const PublicErrorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.string().min(1).optional()
});

export const RegistrationPricesUnavailableResponseSchema =
  PublicErrorResponseSchema.extend({
    code: z.literal("REGISTRATION_PRICES_UNAVAILABLE"),
    message: z.literal("Registration prices are currently unavailable.")
  });

export const RegistrationPricesRetrievalFailedResponseSchema =
  PublicErrorResponseSchema.extend({
    code: z.literal("REGISTRATION_PRICES_RETRIEVAL_FAILED"),
    message: z.literal("Registration prices are temporarily unavailable. Please try again.")
  });
