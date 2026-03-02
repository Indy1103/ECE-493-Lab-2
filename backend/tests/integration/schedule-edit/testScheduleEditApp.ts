import Fastify, { type FastifyInstance } from "fastify";

import { ScheduleEditService } from "../../../src/business/schedules/scheduleEditService.js";
import { ScheduleModificationRepository } from "../../../src/data/schedules/scheduleModificationRepository.js";
import { ScheduleRepository } from "../../../src/data/schedules/scheduleRepository.js";
import { createEditorRoutes } from "../../../src/presentation/routes/editorRoutes.js";
import {
  createEditorScheduleSessionGuard,
  type EditorGuardSessionRecord,
  type EditorGuardSessionRepository
} from "../../../src/security/guards/editorGuard.js";
import {
  InMemoryScheduleAuditRepository,
  ScheduleAuditLogger
} from "../../../src/shared/audit/scheduleAudit.js";
import { InMemoryScheduleMetrics } from "../../../src/shared/metrics/scheduleMetrics.js";

interface ScheduleEditTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  finalizedSchedule?: boolean;
}

class InMemoryConferenceScheduleSessionRepository implements EditorGuardSessionRepository {
  private readonly sessions = new Map<string, EditorGuardSessionRecord>();

  async getSessionById(sessionId: string): Promise<EditorGuardSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: EditorGuardSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface ScheduleEditTestAppContext {
  app: FastifyInstance;
  repository: ScheduleRepository;
  modificationRepository: ScheduleModificationRepository;
  auditRepository: InMemoryScheduleAuditRepository;
  metrics: InMemoryScheduleMetrics;
  sessionRepository: InMemoryConferenceScheduleSessionRepository;
  editorSessionId: string;
  nonEditorSessionId: string;
  editorUserId: string;
  conferenceId: string;
  scheduleId: string;
  validEntries: Array<{
    paperId: string;
    sessionId: string;
    roomId: string;
    timeSlotId: string;
  }>;
}

export async function createScheduleEditTestApp(
  options: ScheduleEditTestAppOptions = {}
): Promise<ScheduleEditTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc15_test" });

  const editorSessionId = "sess_uc15_editor_001";
  const nonEditorSessionId = "sess_uc15_author_001";
  const editorUserId = "f1000000-0000-4000-8000-000000000001";
  const conferenceId = "c1000000-0000-4000-8000-000000000001";

  const validEntries = [
    {
      paperId: "11000000-0000-4000-8000-000000000001",
      sessionId: "21000000-0000-4000-8000-000000000001",
      roomId: "31000000-0000-4000-8000-000000000001",
      timeSlotId: "41000000-0000-4000-8000-000000000001"
    },
    {
      paperId: "11000000-0000-4000-8000-000000000002",
      sessionId: "21000000-0000-4000-8000-000000000002",
      roomId: "31000000-0000-4000-8000-000000000002",
      timeSlotId: "41000000-0000-4000-8000-000000000002"
    }
  ];

  const sessionRepository = new InMemoryConferenceScheduleSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId: editorSessionId,
      accountId: editorUserId,
      role: options.sessionRole ?? "EDITOR",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: nonEditorSessionId,
    accountId: "f1000000-0000-4000-8000-000000000009",
    role: "AUTHOR",
    status: "ACTIVE"
  });

  const repository = new ScheduleRepository();
  const seeded = repository.seedSchedule({
    conferenceId,
    editorIds: [editorUserId],
    status: options.finalizedSchedule ? "FINAL" : "DRAFT",
    updatedByEditorId: editorUserId,
    entries: validEntries,
    referenceCatalog: {
      sessionIds: [
        "21000000-0000-4000-8000-000000000001",
        "21000000-0000-4000-8000-000000000002",
        "21000000-0000-4000-8000-000000000003"
      ],
      roomIds: [
        "31000000-0000-4000-8000-000000000001",
        "31000000-0000-4000-8000-000000000002",
        "31000000-0000-4000-8000-000000000003"
      ],
      timeSlotIds: [
        "41000000-0000-4000-8000-000000000001",
        "41000000-0000-4000-8000-000000000002",
        "41000000-0000-4000-8000-000000000003"
      ]
    }
  });

  const modificationRepository = new ScheduleModificationRepository();
  const auditRepository = new InMemoryScheduleAuditRepository();
  const metrics = new InMemoryScheduleMetrics();

  const service = new ScheduleEditService({
    scheduleRepository: repository,
    scheduleModificationRepository: modificationRepository,
    auditLogger: new ScheduleAuditLogger({ repository: auditRepository }),
    metrics
  });

  app.register(
    createEditorRoutes({
      scheduleService: service,
      conferenceScheduleSessionGuard: createEditorScheduleSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    modificationRepository,
    auditRepository,
    metrics,
    sessionRepository,
    editorSessionId,
    nonEditorSessionId,
    editorUserId,
    conferenceId,
    scheduleId: seeded.id,
    validEntries
  };
}
