import assert from "node:assert/strict";
import test from "node:test";

import { ConferenceScheduleAuditLogger } from "../../src/business/conference-schedule/audit-logger.js";
import { GenerateConferenceScheduleService } from "../../src/business/conference-schedule/generate-conference-schedule.service.js";
import {
  CONFERENCE_SCHEDULE_OUTCOMES,
  CONFERENCE_SCHEDULE_REASON_CODES
} from "../../src/business/conference-schedule/schedule-outcome.js";
import { ConferenceScheduleBuilder } from "../../src/business/conference-schedule/schedule-builder.js";
import {
  CONFERENCE_SCHEDULE_PORTS_MARKER,
  type ConferenceScheduleAuditRepository as ConferenceScheduleAuditRepositoryPort
} from "../../src/business/conference-schedule/ports.js";
import {
  ConferenceScheduleAuditRepository,
  PrismaConferenceScheduleRepository
} from "../../src/data/conference-schedule/conference-schedule.repository.js";
import {
  ConferenceScheduleErrorResponseSchema,
  NoAcceptedPapersResponseSchema,
  ScheduleGeneratedResponseSchema,
  buildConferenceScheduleSessionExpiredResponse,
  mapGenerateConferenceScheduleOutcome
} from "../../src/presentation/conference-schedule/error-mapper.js";
import { createGenerateConferenceScheduleHandler } from "../../src/presentation/conference-schedule/generate-conference-schedule.handler.js";
import {
  createConferenceScheduleRoutes,
  requireConferenceScheduleTransportSecurity
} from "../../src/presentation/conference-schedule/routes.js";
import {
  createConferenceScheduleSessionGuard,
  type ConferenceScheduleSessionRecord,
  type ConferenceScheduleSessionRepository
} from "../../src/security/session-guard.js";

function createReplyDouble() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return this;
    }
  };
}

test("schedule builder creates deterministic ordered entries", () => {
  const builder = new ConferenceScheduleBuilder();

  const entries = builder.build({
    conferenceId: "conf-1",
    acceptedPapers: [
      { paperId: "paper-2", title: "B", authorId: "a2", decision: "ACCEPT" },
      { paperId: "paper-1", title: "A", authorId: "a1", decision: "ACCEPT" }
    ]
  });

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.paperId, "paper-1");
  assert.equal(entries[0]?.sessionCode, "S01");
  assert.equal(entries[1]?.paperId, "paper-2");
  assert.equal(entries[1]?.roomCode, "R02");
});

test("audit logger and repository sanitize metadata and clone records", async () => {
  const repository = new ConferenceScheduleAuditRepository();
  const logger = new ConferenceScheduleAuditLogger({ repository });

  await logger.record({
    actorUserId: "admin-1",
    conferenceId: "conf-1",
    outcome: "SCHEDULE_GENERATED",
    reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.SCHEDULE_CREATED,
    metadata: {
      acceptedPaperCount: 2,
      paperTitles: ["A", "B"]
    }
  });

  await repository.record({
    actorUserId: "admin-2",
    conferenceId: "conf-2",
    outcome: "UNAVAILABLE_DENIED",
    reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.CONFERENCE_NOT_FOUND_OR_DENIED,
    metadata: {
      paperTitles: ["Hidden"]
    }
  });

  const list = repository.list();
  assert.equal(list.length, 2);
  assert.equal("paperTitles" in (list[0]?.metadata ?? {}), false);
  assert.equal("paperTitles" in (list[1]?.metadata ?? {}), false);
  assert.equal(repository.isEncryptedAtRest(), true);

  list[0]!.metadata.acceptedPaperCount = 99;
  assert.equal(repository.list()[0]?.metadata.acceptedPaperCount, 2);
});

test("repository covers lock, list, save, and encryption branches", async () => {
  const repository = new PrismaConferenceScheduleRepository();

  repository.seedConference({
    conferenceId: "conf-1",
    adminIds: ["admin-1"],
    acceptedPapers: [{ paperId: "paper-1", title: "A", authorId: "a1", decision: "ACCEPT" }]
  });

  repository.seedConference({
    conferenceId: "conf-2",
    adminIds: ["admin-1"],
    acceptedPapers: []
  });

  const listed = await repository.listAcceptedPapers("conf-1", "admin-1");
  assert.equal(listed?.length, 1);

  const denied = await repository.listAcceptedPapers("conf-1", "admin-2");
  assert.equal(denied, null);

  await repository.saveGeneratedSchedule(
    {
      conferenceId: "conf-1",
      entries: [
        {
          paperId: "paper-1",
          sessionCode: "S01",
          roomCode: "R01",
          startTime: "2026-09-01T09:00:00.000Z",
          endTime: "2026-09-01T09:30:00.000Z"
        }
      ]
    },
    "admin-1"
  );

  const schedule = repository.getSchedule("conf-1");
  assert.equal(schedule?.entries.length, 1);
  assert.equal(repository.getSchedule("missing-conf"), null);

  let releaseFirst!: () => void;

  const first = repository.withConferenceScheduleLock("conf-1", async () => {
    await new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    return "a";
  });

  // Ensure first lock is in-flight before second lock is registered.
  await Promise.resolve();

  const second = repository.withConferenceScheduleLock("conf-1", async () => "b");

  releaseFirst();

  const lockResults = await Promise.all([first, second]);
  assert.deepEqual(lockResults.sort(), ["a", "b"]);

  assert.equal(repository.isEncryptedAtRest(), true);
  assert.equal(CONFERENCE_SCHEDULE_PORTS_MARKER, "conference_schedule_ports_marker");
});

test("service maps unavailable, no accepted, and generated outcomes", async () => {
  const audits: string[] = [];

  const service = new GenerateConferenceScheduleService({
    repository: {
      async withConferenceScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async listAcceptedPapers(conferenceId: string) {
        if (conferenceId === "missing") {
          return null;
        }

        if (conferenceId === "empty") {
          return [];
        }

        return [
          {
            paperId: "paper-1",
            title: "A",
            authorId: "a1",
            decision: "ACCEPT" as const
          }
        ];
      },
      async saveGeneratedSchedule() {
        return;
      }
    },
    scheduleBuilder: new ConferenceScheduleBuilder(),
    auditLogger: {
      async record(event: { outcome: string }) {
        audits.push(event.outcome);
      }
    } as ConferenceScheduleAuditLogger
  });

  const unavailable = await service.execute({
    adminUserId: "admin-1",
    conferenceId: "missing",
    requestId: "req-1"
  });
  assert.equal(unavailable.outcome, "UNAVAILABLE_DENIED");

  const empty = await service.execute({
    adminUserId: "admin-1",
    conferenceId: "empty",
    requestId: "req-2"
  });
  assert.equal(empty.outcome, "NO_ACCEPTED_PAPERS");

  const generated = await service.execute({
    adminUserId: "admin-1",
    conferenceId: "ok",
    requestId: "req-3"
  });
  assert.equal(generated.outcome, "SCHEDULE_GENERATED");

  assert.deepEqual(audits, ["UNAVAILABLE_DENIED", "NO_ACCEPTED_PAPERS", "SCHEDULE_GENERATED"]);
});

test("error mapper covers generated/no-accepted/unavailable/default/session-expired branches", () => {
  const generated = mapGenerateConferenceScheduleOutcome({
    outcome: "SCHEDULE_GENERATED",
    statusCode: 200,
    outcomeCode: "SCHEDULE_GENERATED",
    conferenceId: "conf-1",
    entries: []
  });
  assert.equal(generated.statusCode, 200);
  assert.equal(ScheduleGeneratedResponseSchema.safeParse(generated.body).success, true);

  const empty = mapGenerateConferenceScheduleOutcome({
    outcome: "NO_ACCEPTED_PAPERS",
    statusCode: 409,
    outcomeCode: "NO_ACCEPTED_PAPERS",
    message: "none"
  });
  assert.equal(empty.statusCode, 409);
  assert.equal(NoAcceptedPapersResponseSchema.safeParse(empty.body).success, true);

  const unavailable = mapGenerateConferenceScheduleOutcome({
    outcome: "UNAVAILABLE_DENIED",
    statusCode: 403,
    outcomeCode: "UNAVAILABLE_DENIED",
    message: "no"
  });
  assert.equal(unavailable.statusCode, 403);
  assert.equal(ConferenceScheduleErrorResponseSchema.safeParse(unavailable.body).success, true);

  const fallback = mapGenerateConferenceScheduleOutcome({ outcome: "UNKNOWN" } as never);
  assert.equal(fallback.statusCode, 404);

  const expired = buildConferenceScheduleSessionExpiredResponse();
  assert.equal(expired.statusCode, 401);
  assert.equal((expired.body as { outcome: string }).outcome, "SESSION_EXPIRED");
});

test("handler and routes cover missing session, non-admin, generated, transport, and route wiring", async () => {
  const handler = createGenerateConferenceScheduleHandler({
    service: {
      async execute() {
        return {
          outcome: "SCHEDULE_GENERATED" as const,
          statusCode: 200 as const,
          outcomeCode: "SCHEDULE_GENERATED" as const,
          conferenceId: "conf-1",
          entries: []
        };
      }
    }
  });

  const noSessionReply = createReplyDouble();
  await handler({ id: "req-1", params: { conferenceId: "conf-1" } } as never, noSessionReply as never);
  assert.equal(noSessionReply.statusCode, 401);

  const nonAdminReply = createReplyDouble();
  await handler(
    {
      id: "req-2",
      params: { conferenceId: "conf-1" },
      conferenceScheduleSession: { userId: "u1", sessionId: "s1", role: "EDITOR" }
    } as never,
    nonAdminReply as never
  );
  assert.equal(nonAdminReply.statusCode, 403);

  const okReply = createReplyDouble();
  await handler(
    {
      id: "req-3",
      params: { conferenceId: "conf-1" },
      conferenceScheduleSession: { userId: "u1", sessionId: "s1", role: "ADMIN" }
    } as never,
    okReply as never
  );
  assert.equal(okReply.statusCode, 200);

  const insecureReply = createReplyDouble();
  await requireConferenceScheduleTransportSecurity({ headers: {} }, insecureReply as never);
  assert.equal(insecureReply.statusCode, 426);

  const secureReply = createReplyDouble();
  await requireConferenceScheduleTransportSecurity(
    { headers: { "x-forwarded-proto": "https" } },
    secureReply as never
  );
  assert.equal(secureReply.payload, undefined);

  const routes = createConferenceScheduleRoutes({
    service: { execute: async () => ({ outcome: "UNAVAILABLE_DENIED" } as never) },
    conferenceScheduleSessionGuard: async () => {}
  });

  const calls: Array<{ path: string; preHandlerCount: number }> = [];

  await routes(
    {
      post(path: string, options: { preHandler: unknown[] }) {
        calls.push({ path, preHandlerCount: options.preHandler.length });
      }
    } as never,
    {} as never
  );

  assert.deepEqual(calls, [{ path: "/api/admin/conference/:conferenceId/schedule", preHandlerCount: 2 }]);
});

test("conference schedule session guard covers missing, invalid, valid, and cms_session cookie", async () => {
  class SessionRepository implements ConferenceScheduleSessionRepository {
    constructor(private readonly record: ConferenceScheduleSessionRecord | null) {}
    async getSessionById() {
      return this.record;
    }
  }

  const missingGuard = createConferenceScheduleSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "admin-1",
      role: "ADMIN",
      status: "ACTIVE"
    })
  });

  const missingReply = createReplyDouble();
  await missingGuard({ headers: {} } as never, missingReply as never);
  assert.equal(missingReply.statusCode, 401);

  const invalidGuard = createConferenceScheduleSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "admin-1",
      role: "ADMIN",
      status: "EXPIRED"
    })
  });

  const invalidReply = createReplyDouble();
  await invalidGuard({ headers: { cookie: "session=s1" } } as never, invalidReply as never);
  assert.equal(invalidReply.statusCode, 401);

  const validGuard = createConferenceScheduleSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s1",
      accountId: "admin-1",
      role: "ADMIN",
      status: "ACTIVE"
    })
  });

  const validRequest = { headers: { cookie: "session=s1" } } as never;
  await validGuard(validRequest, createReplyDouble() as never);
  assert.equal((validRequest as any).conferenceScheduleSession.role, "ADMIN");

  const cmsGuard = createConferenceScheduleSessionGuard({
    sessionRepository: new SessionRepository({
      sessionId: "s2",
      accountId: "admin-2",
      role: "ADMIN",
      status: "ACTIVE"
    })
  });

  const cmsRequest = { headers: { cookie: "cms_session=s2" } } as never;
  await cmsGuard(cmsRequest, createReplyDouble() as never);
  assert.equal((cmsRequest as any).conferenceScheduleSession.sessionId, "s2");
});

test("outcome constants and audit port shape remain stable", async () => {
  assert.equal(CONFERENCE_SCHEDULE_OUTCOMES.SCHEDULE_GENERATED, "SCHEDULE_GENERATED");
  assert.equal(CONFERENCE_SCHEDULE_OUTCOMES.NO_ACCEPTED_PAPERS, "NO_ACCEPTED_PAPERS");
  assert.equal(CONFERENCE_SCHEDULE_OUTCOMES.UNAVAILABLE_DENIED, "UNAVAILABLE_DENIED");
  assert.equal(CONFERENCE_SCHEDULE_OUTCOMES.SESSION_EXPIRED, "SESSION_EXPIRED");

  class InMemoryAuditPort implements ConferenceScheduleAuditRepositoryPort {
    public readonly events: Array<Record<string, unknown>> = [];
    async record(event: any): Promise<void> {
      this.events.push(event);
    }
  }

  const port = new InMemoryAuditPort();
  const logger = new ConferenceScheduleAuditLogger({ repository: port });

  await logger.record({
    actorUserId: "admin-1",
    conferenceId: "conf-1",
    outcome: "SESSION_EXPIRED",
    reasonCode: CONFERENCE_SCHEDULE_REASON_CODES.SESSION_INVALID
  });

  assert.equal(port.events.length, 1);
  assert.deepEqual(port.events[0]?.metadata, {});
});
