import { z } from "zod";

export const ScheduleEditEntrySchema = z.object({
  paperId: z.string().uuid(),
  sessionId: z.string().uuid(),
  roomId: z.string().uuid(),
  timeSlotId: z.string().uuid()
});

export const ScheduleEditRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  entries: z.array(ScheduleEditEntrySchema).min(1)
});

export type ScheduleEditEntryInput = z.infer<typeof ScheduleEditEntrySchema>;
export type ScheduleEditRequestInput = z.infer<typeof ScheduleEditRequestSchema>;
