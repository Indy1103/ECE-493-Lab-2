export interface ConferenceCycle {
  id: string;
  intakeStatus: "OPEN" | "CLOSED";
  metadataPolicyVersion: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ConferenceCycleRepository {
  getActiveCycle(): Promise<ConferenceCycle>;
}

interface InMemoryConferenceCycleRepositoryOptions {
  intakeStatus?: "OPEN" | "CLOSED";
}

export class InMemoryConferenceCycleRepository implements ConferenceCycleRepository {
  private readonly cycle: ConferenceCycle;

  constructor(options: InMemoryConferenceCycleRepositoryOptions = {}) {
    this.cycle = {
      id: "00000000-0000-4000-9000-000000000501",
      intakeStatus: options.intakeStatus ?? "OPEN",
      metadataPolicyVersion: "CMS Manuscript Submission Policy v1.0",
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-12-31T23:59:59.999Z")
    };
  }

  async getActiveCycle(): Promise<ConferenceCycle> {
    return { ...this.cycle };
  }
}
