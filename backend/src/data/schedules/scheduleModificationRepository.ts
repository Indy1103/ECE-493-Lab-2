import { randomUUID } from "node:crypto";

export type ScheduleModificationStatus = "PENDING" | "APPLIED" | "REJECTED";

export interface ScheduleModificationRecord {
  id: string;
  scheduleId: string;
  requestedByEditorId: string;
  requestedAt: Date;
  status: ScheduleModificationStatus;
}

interface BeginScheduleModificationInput {
  scheduleId: string;
  requestedByEditorId: string;
}

export class ScheduleModificationRepository {
  private readonly requests = new Map<string, ScheduleModificationRecord>();

  async begin(input: BeginScheduleModificationInput): Promise<ScheduleModificationRecord> {
    const record: ScheduleModificationRecord = {
      id: randomUUID(),
      scheduleId: input.scheduleId,
      requestedByEditorId: input.requestedByEditorId,
      requestedAt: new Date(),
      status: "PENDING"
    };

    this.requests.set(record.id, { ...record });

    return { ...record, requestedAt: new Date(record.requestedAt) };
  }

  async complete(requestId: string, status: Exclude<ScheduleModificationStatus, "PENDING">): Promise<void> {
    const current = this.requests.get(requestId);
    if (!current) {
      return;
    }

    this.requests.set(requestId, {
      ...current,
      status
    });
  }

  list(): ScheduleModificationRecord[] {
    return Array.from(this.requests.values()).map((record) => ({
      ...record,
      requestedAt: new Date(record.requestedAt)
    }));
  }
}
