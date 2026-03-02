interface SubmissionHandoffServiceOptions {
  forceFailure?: boolean;
}

export interface DownstreamSubmissionMarker {
  markDownstreamAvailable(submissionId: string): Promise<void>;
}

export class SubmissionHandoffService {
  private readonly forceFailure: boolean;

  constructor(
    private readonly marker: DownstreamSubmissionMarker,
    options: SubmissionHandoffServiceOptions = {}
  ) {
    this.forceFailure = options.forceFailure ?? false;
  }

  async handoff(submissionId: string): Promise<void> {
    if (this.forceFailure) {
      throw new Error("handoff unavailable");
    }

    await this.marker.markDownstreamAvailable(submissionId);
  }
}
