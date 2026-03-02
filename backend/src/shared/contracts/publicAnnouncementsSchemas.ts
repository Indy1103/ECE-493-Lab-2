import { z } from "zod";

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  publishStart: z.string().datetime(),
  publishEnd: z.string().datetime().nullable()
});

export const PublicAnnouncementsResponseSchema = z.object({
  state: z.enum(["AVAILABLE", "EMPTY"]),
  announcements: z.array(AnnouncementSchema),
  message: z.string()
});

export const ErrorResponseSchema = z.object({
  code: z.literal("ANNOUNCEMENTS_UNAVAILABLE"),
  message: z.string(),
  requestId: z.string()
});
