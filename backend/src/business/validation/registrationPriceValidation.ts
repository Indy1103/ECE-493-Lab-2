import { z } from "zod";

export const RegistrationPriceSchema = z.object({
  id: z.string().uuid(),
  attendanceType: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3)
});

export const PublishedRegistrationPriceListSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.literal("PUBLISHED"),
  publishedAt: z.string().datetime({ offset: true }),
  effectiveFrom: z.string().date().nullable(),
  effectiveTo: z.string().date().nullable(),
  prices: z.array(RegistrationPriceSchema).min(1)
});

export type PublishedRegistrationPriceList = z.infer<
  typeof PublishedRegistrationPriceListSchema
>;
