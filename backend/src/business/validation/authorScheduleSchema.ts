import { z } from "zod";

export const AuthorScheduleRequestSchema = z.object({
  authorUserId: z.string().uuid(),
  requestId: z.string().min(1)
});

export const AuthorScheduleEntrySchema = z.object({
  paperId: z.string().uuid(),
  sessionId: z.string().uuid(),
  roomId: z.string().uuid(),
  timeSlotId: z.string().uuid()
});

export const AuthorSchedulePresentationSchema = z.object({
  paperId: z.string().uuid(),
  roomId: z.string().uuid(),
  timeSlotId: z.string().uuid()
});

export const AuthorScheduleResponseSchema = z.object({
  id: z.string().uuid(),
  conferenceId: z.string().uuid(),
  status: z.enum(["DRAFT", "FINAL"]),
  entries: z.array(AuthorScheduleEntrySchema),
  authorPresentations: z.array(AuthorSchedulePresentationSchema)
});

export const AuthorScheduleErrorSchema = z.object({
  code: z.string(),
  message: z.string()
});
