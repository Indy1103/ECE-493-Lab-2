export interface AuthorScheduleMetricSink {
  incrementSuccess(): void;
  incrementUnpublished(): void;
  incrementDenied(): void;
  incrementFailure(): void;
}

export class InMemoryAuthorScheduleMetrics implements AuthorScheduleMetricSink {
  success = 0;
  unpublished = 0;
  denied = 0;
  failures = 0;

  incrementSuccess(): void {
    this.success += 1;
  }

  incrementUnpublished(): void {
    this.unpublished += 1;
  }

  incrementDenied(): void {
    this.denied += 1;
  }

  incrementFailure(): void {
    this.failures += 1;
  }
}
