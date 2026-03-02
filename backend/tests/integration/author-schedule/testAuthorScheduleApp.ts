import Fastify, { type FastifyInstance } from "fastify";

import { AuthorScheduleService } from "../../../src/business/schedules/authorScheduleService.js";
import { AuthorNotificationRepository } from "../../../src/data/notifications/authorNotificationRepository.js";
import { AuthorScheduleRepository } from "../../../src/data/schedules/authorScheduleRepository.js";
import { ScheduleReadConsistency } from "../../../src/data/schedules/scheduleReadConsistency.js";
import { createAuthorRoutes } from "../../../src/presentation/routes/authorRoutes.js";
import {
  createAuthorScheduleSessionGuard,
  type AuthorGuardSessionRecord,
  type AuthorGuardSessionRepository
} from "../../../src/security/guards/authorGuard.js";
import {
  InMemoryScheduleAccessAuditRepository,
  ScheduleAccessAuditLogger
} from "../../../src/shared/audit/scheduleAccessAudit.js";
import { InMemoryAuthorScheduleMetrics } from "../../../src/shared/metrics/authorScheduleMetrics.js";

interface AuthorScheduleTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  publishedSchedule?: boolean;
  includeAcceptedPaper?: boolean;
  forceReadFailure?: boolean;
  forceNotificationFailure?: boolean;
}

class InMemoryAuthorScheduleSessionRepository implements AuthorGuardSessionRepository {
  private readonly sessions = new Map<string, AuthorGuardSessionRecord>();

  async getSessionById(sessionId: string): Promise<AuthorGuardSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: AuthorGuardSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface AuthorScheduleTestAppContext {
  app: FastifyInstance;
  scheduleRepository: AuthorScheduleRepository;
  notificationRepository: AuthorNotificationRepository;
  auditRepository: InMemoryScheduleAccessAuditRepository;
  metrics: InMemoryAuthorScheduleMetrics;
  sessionRepository: InMemoryAuthorScheduleSessionRepository;
  authorSessionId: string;
  editorSessionId: string;
  authorUserId: string;
  conferenceId: string;
  scheduleId: string;
}

export async function createAuthorScheduleTestApp(
  options: AuthorScheduleTestAppOptions = {}
): Promise<AuthorScheduleTestAppContext> {
  let reqCounter = 0;
  const app = Fastify({ logger: false, genReqId: () => `req_uc16_test_${++reqCounter}` });

  const authorSessionId = "sess_uc16_author_001";
  const editorSessionId = "sess_uc16_editor_001";
  const authorUserId = "d1000000-0000-4000-8000-000000000001";
  const conferenceId = "c1600000-0000-4000-8000-000000000001";

  const sessionRepository = new InMemoryAuthorScheduleSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId: authorSessionId,
      accountId: authorUserId,
      role: options.sessionRole ?? "AUTHOR",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: editorSessionId,
    accountId: "d1000000-0000-4000-8000-000000000099",
    role: "EDITOR",
    status: "ACTIVE"
  });

  const scheduleRepository = new AuthorScheduleRepository({
    readConsistency: new ScheduleReadConsistency(),
    forceReadFailure: options.forceReadFailure ?? false
  });

  const seeded = scheduleRepository.seedSchedule({
    conferenceId,
    status: "FINAL",
    entries: [
      {
        paperId: "16000000-0000-4000-8000-000000000001",
        sessionId: "26000000-0000-4000-8000-000000000001",
        roomId: "36000000-0000-4000-8000-000000000001",
        timeSlotId: "46000000-0000-4000-8000-000000000001"
      },
      {
        paperId: "16000000-0000-4000-8000-000000000002",
        sessionId: "26000000-0000-4000-8000-000000000002",
        roomId: "36000000-0000-4000-8000-000000000002",
        timeSlotId: "46000000-0000-4000-8000-000000000002"
      }
    ],
    publication: {
      status: options.publishedSchedule === false ? "UNPUBLISHED" : "PUBLISHED",
      publishedByEditorId: "e1600000-0000-4000-8000-000000000001",
      publishedAt: new Date("2026-03-02T12:00:00.000Z")
    },
    acceptedPapersByAuthor: options.includeAcceptedPaper === false
      ? {}
      : {
          [authorUserId]: ["16000000-0000-4000-8000-000000000001"]
        }
  });

  const notificationRepository = new AuthorNotificationRepository({
    forceWriteFailure: options.forceNotificationFailure ?? false
  });
  const auditRepository = new InMemoryScheduleAccessAuditRepository();
  const metrics = new InMemoryAuthorScheduleMetrics();

  const service = new AuthorScheduleService({
    scheduleRepository,
    notificationRepository,
    auditLogger: new ScheduleAccessAuditLogger({ repository: auditRepository }),
    metrics
  });

  app.register(
    createAuthorRoutes({
      authorScheduleService: service,
      authorScheduleSessionGuard: createAuthorScheduleSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    scheduleRepository,
    notificationRepository,
    auditRepository,
    metrics,
    sessionRepository,
    authorSessionId,
    editorSessionId,
    authorUserId,
    conferenceId,
    scheduleId: seeded.id
  };
}
