import Fastify, { type FastifyInstance } from "fastify";

import { ConferenceScheduleAuditLogger } from "../../../src/business/conference-schedule/audit-logger.js";
import { ConferenceScheduleBuilder } from "../../../src/business/conference-schedule/schedule-builder.js";
import { GenerateConferenceScheduleService } from "../../../src/business/conference-schedule/generate-conference-schedule.service.js";
import {
  ConferenceScheduleAuditRepository,
  PrismaConferenceScheduleRepository
} from "../../../src/data/conference-schedule/conference-schedule.repository.js";
import { createConferenceScheduleRoutes } from "../../../src/presentation/conference-schedule/routes.js";
import {
  createConferenceScheduleSessionGuard,
  type ConferenceScheduleSessionRecord,
  type ConferenceScheduleSessionRepository
} from "../../../src/security/session-guard.js";

interface ConferenceScheduleTestAppOptions {
  includeSession?: boolean;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  sessionRole?: string;
  conferenceScenario?: "WITH_ACCEPTED" | "NO_ACCEPTED" | "INACCESSIBLE";
}

class InMemoryConferenceScheduleSessionRepository implements ConferenceScheduleSessionRepository {
  private readonly sessions = new Map<string, ConferenceScheduleSessionRecord>();

  async getSessionById(sessionId: string): Promise<ConferenceScheduleSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: ConferenceScheduleSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface ConferenceScheduleTestAppContext {
  app: FastifyInstance;
  repository: PrismaConferenceScheduleRepository;
  auditRepository: ConferenceScheduleAuditRepository;
  sessionRepository: InMemoryConferenceScheduleSessionRepository;
  adminSessionId: string;
  nonAdminSessionId: string;
  adminUserId: string;
  conferenceIds: {
    withAccepted: string;
    noAccepted: string;
    inaccessible: string;
  };
}

export async function createConferenceScheduleTestApp(
  options: ConferenceScheduleTestAppOptions = {}
): Promise<ConferenceScheduleTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_uc14_test" });

  const adminSessionId = "sess_uc14_admin_001";
  const nonAdminSessionId = "sess_uc14_author_001";
  const adminUserId = "f0000000-0000-4000-8000-000000000001";

  const conferenceIds = {
    withAccepted: "c0000000-0000-4000-8000-000000000001",
    noAccepted: "c0000000-0000-4000-8000-000000000002",
    inaccessible: "c0000000-0000-4000-8000-000000000003"
  };

  const sessionRepository = new InMemoryConferenceScheduleSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId: adminSessionId,
      accountId: adminUserId,
      role: options.sessionRole ?? "ADMIN",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  await sessionRepository.seedSession({
    sessionId: nonAdminSessionId,
    accountId: "f0000000-0000-4000-8000-000000000010",
    role: "AUTHOR",
    status: "ACTIVE"
  });

  const repository = new PrismaConferenceScheduleRepository();

  repository.seedConference({
    conferenceId: conferenceIds.withAccepted,
    adminIds: [adminUserId],
    acceptedPapers: [
      {
        paperId: "p0000000-0000-4000-8000-000000000001",
        title: "Paper A",
        authorId: "a0000000-0000-4000-8000-000000000001",
        decision: "ACCEPT"
      },
      {
        paperId: "p0000000-0000-4000-8000-000000000002",
        title: "Paper B",
        authorId: "a0000000-0000-4000-8000-000000000002",
        decision: "ACCEPT"
      }
    ]
  });

  repository.seedConference({
    conferenceId: conferenceIds.noAccepted,
    adminIds: [adminUserId],
    acceptedPapers: []
  });

  repository.seedConference({
    conferenceId: conferenceIds.inaccessible,
    adminIds: ["f0000000-0000-4000-8000-000000000777"],
    acceptedPapers: [
      {
        paperId: "p0000000-0000-4000-8000-000000000099",
        title: "Hidden",
        authorId: "a0000000-0000-4000-8000-000000000099",
        decision: "ACCEPT"
      }
    ]
  });

  const auditRepository = new ConferenceScheduleAuditRepository();

  const service = new GenerateConferenceScheduleService({
    repository,
    scheduleBuilder: new ConferenceScheduleBuilder(),
    auditLogger: new ConferenceScheduleAuditLogger({ repository: auditRepository })
  });

  app.register(
    createConferenceScheduleRoutes({
      service,
      conferenceScheduleSessionGuard: createConferenceScheduleSessionGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    auditRepository,
    sessionRepository,
    adminSessionId,
    nonAdminSessionId,
    adminUserId,
    conferenceIds
  };
}
