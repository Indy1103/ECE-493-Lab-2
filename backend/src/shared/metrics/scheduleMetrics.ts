export interface ScheduleEditMetricSink {
  incrementSuccess(): void;
  incrementRejected(reason: string): void;
  incrementConflict(): void;
}

export class InMemoryScheduleMetrics implements ScheduleEditMetricSink {
  success = 0;
  conflicts = 0;
  rejectedByReason = new Map<string, number>();

  incrementSuccess(): void {
    this.success += 1;
  }

  incrementRejected(reason: string): void {
    const next = (this.rejectedByReason.get(reason) ?? 0) + 1;
    this.rejectedByReason.set(reason, next);
  }

  incrementConflict(): void {
    this.conflicts += 1;
  }
}
