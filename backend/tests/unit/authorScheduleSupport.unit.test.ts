import assert from "node:assert/strict";
import test from "node:test";

import { AuthorScheduleService } from "../../src/business/schedules/authorScheduleService.js";
import { ScheduleReadConsistency } from "../../src/data/schedules/scheduleReadConsistency.js";
import { AuthorNotificationRepository } from "../../src/data/notifications/authorNotificationRepository.js";
import { AuthorScheduleRepository } from "../../src/data/schedules/authorScheduleRepository.js";
import {
  AuthorScheduleErrorSchema,
  AuthorScheduleResponseSchema,
  createGetAuthorScheduleHandler
} from "../../src/presentation/controllers/authorScheduleController.js";
import {
  createAuthorScheduleSessionGuard,
  ensureAuthorRole
} from "../../src/security/guards/authorGuard.js";
import {
  InMemoryScheduleAccessAuditRepository,
  ScheduleAccessAuditLogger
} from "../../src/shared/audit/scheduleAccessAudit.js";
import {
  redactManuscriptSubmissionLog,
  redactPasswordChangeLog,
  redactScheduleAccessLog,
  redactScheduleEditLog
} from "../../src/shared/logging/redaction.js";
import { InMemoryAuthorScheduleMetrics } from "../../src/shared/metrics/authorScheduleMetrics.js";

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

test("author role guard enforces role and session parsing branches", async () => {
  const deniedReply = createReplyDouble();
  assert.equal(ensureAuthorRole("EDITOR", deniedReply as any), false);
  assert.equal(deniedReply.statusCode, 403);

  const allowedReply = createReplyDouble();
  assert.equal(ensureAuthorRole("AUTHOR", allowedReply as any), true);

  const guard = createAuthorScheduleSessionGuard({
    sessionRepository: {
      async getSessionById(sessionId: string) {
        if (sessionId === "valid") {
          return {
            sessionId: "valid",
            accountId: "a1000000-0000-4000-8000-000000000001",
            role: "AUTHOR",
            status: "ACTIVE" as const
          };
        }

        if (sessionId === "revoked") {
          return {
            sessionId: "revoked",
            accountId: "a1000000-0000-4000-8000-000000000001",
            role: "AUTHOR",
            status: "REVOKED" as const
          };
        }

        return null;
      }
    }
  });

  const missingReply = createReplyDouble();
  const missingRequest = { headers: {} } as any;
  await guard(missingRequest, missingReply as any);
  assert.equal(missingReply.statusCode, 401);

  const revokedReply = createReplyDouble();
  const revokedRequest = { headers: { cookie: "session=revoked" } } as any;
  await guard(revokedRequest, revokedReply as any);
  assert.equal(revokedReply.statusCode, 401);

  const emptyReply = createReplyDouble();
  const emptyRequest = { headers: { cookie: "session=" } } as any;
  await guard(emptyRequest, emptyReply as any);
  assert.equal(emptyReply.statusCode, 401);

  const successReply = createReplyDouble();
  const successRequest = { headers: { cookie: "cms_session=valid" } } as any;
  await guard(successRequest, successReply as any);
  assert.equal(successRequest.authorScheduleSession.userId, "a1000000-0000-4000-8000-000000000001");

  const prefixedReply = createReplyDouble();
  const prefixedRequest = { headers: { cookie: "token=abc; session=valid" } } as any;
  await guard(prefixedRequest, prefixedReply as any);
  assert.equal(prefixedRequest.authorScheduleSession.userId, "a1000000-0000-4000-8000-000000000001");
});

test("read consistency helper serializes concurrent reads", async () => {
  const readConsistency = new ScheduleReadConsistency();
  const sequence: string[] = [];

  await Promise.all([
    readConsistency.withConsistentRead("conference-1", async () => {
      sequence.push("start-1");
      await new Promise((resolve) => setTimeout(resolve, 5));
      sequence.push("end-1");
      return 1;
    }),
    readConsistency.withConsistentRead("conference-1", async () => {
      sequence.push("start-2");
      sequence.push("end-2");
      return 2;
    })
  ]);

  assert.deepEqual(sequence, ["start-1", "end-1", "start-2", "end-2"]);
});

test("repositories cover availability branches and encryption markers", async () => {
  const defaultRepository = new AuthorScheduleRepository();
  assert.equal(defaultRepository.isEncryptedAtRest(), true);

  const repository = new AuthorScheduleRepository({ readConsistency: new ScheduleReadConsistency() });
  const seeded = repository.seedSchedule({
    conferenceId: "c1700000-0000-4000-8000-000000000001",
    status: "FINAL",
    entries: [
      {
        paperId: "17000000-0000-4000-8000-000000000001",
        sessionId: "27000000-0000-4000-8000-000000000001",
        roomId: "37000000-0000-4000-8000-000000000001",
        timeSlotId: "47000000-0000-4000-8000-000000000001"
      }
    ],
    publication: {
      status: "UNPUBLISHED",
      publishedByEditorId: "e1700000-0000-4000-8000-000000000001",
      publishedAt: new Date()
    },
    acceptedPapersByAuthor: {
      "a1700000-0000-4000-8000-000000000001": ["17000000-0000-4000-8000-000000000001"]
    }
  });

  const unpublished = await repository.getAuthorSchedule("a1700000-0000-4000-8000-000000000001");
  assert.equal(unpublished.state, "UNPUBLISHED");

  repository.setPublicationStatus(seeded.id, "PUBLISHED");
  const available = await repository.getAuthorSchedule("a1700000-0000-4000-8000-000000000001");
  assert.equal(available.state, "AVAILABLE");

  const denied = await repository.getAuthorSchedule("a1700000-0000-4000-8000-000000000099");
  assert.equal(denied.state, "UNAVAILABLE_DENIED");

  repository.seedSchedule({
    conferenceId: "c1700000-0000-4000-8000-000000000099",
    status: "FINAL",
    entries: [
      {
        paperId: "17000000-0000-4000-8000-000000000099",
        sessionId: "27000000-0000-4000-8000-000000000099",
        roomId: "37000000-0000-4000-8000-000000000099",
        timeSlotId: "47000000-0000-4000-8000-000000000099"
      }
    ],
    publication: {
      status: "PUBLISHED",
      publishedByEditorId: "e1700000-0000-4000-8000-000000000099",
      publishedAt: new Date()
    },
    acceptedPapersByAuthor: {
      "a1700000-0000-4000-8000-000000000002": ["17000000-0000-4000-8000-000000000123"]
    }
  });

  const noMatchedSchedule = await repository.getAuthorSchedule("a1700000-0000-4000-8000-000000000002");
  assert.equal(noMatchedSchedule.state, "UNAVAILABLE_DENIED");

  repository.setPublicationStatus("missing-schedule-id", "PUBLISHED");

  const failingRepository = new AuthorScheduleRepository({
    readConsistency: new ScheduleReadConsistency(),
    forceReadFailure: true
  });
  failingRepository.seedSchedule({
    conferenceId: "c1700000-0000-4000-8000-000000000333",
    status: "FINAL",
    entries: [
      {
        paperId: "17000000-0000-4000-8000-000000000333",
        sessionId: "27000000-0000-4000-8000-000000000333",
        roomId: "37000000-0000-4000-8000-000000000333",
        timeSlotId: "47000000-0000-4000-8000-000000000333"
      }
    ],
    publication: {
      status: "PUBLISHED",
      publishedByEditorId: "e1700000-0000-4000-8000-000000000333",
      publishedAt: new Date()
    },
    acceptedPapersByAuthor: {
      "a1700000-0000-4000-8000-000000000333": ["17000000-0000-4000-8000-000000000333"]
    }
  });
  await assert.rejects(
    () => failingRepository.getAuthorSchedule("a1700000-0000-4000-8000-000000000333"),
    /SCHEDULE_READ_FAILED/
  );

  assert.equal(repository.isEncryptedAtRest(), true);

  const notificationRepository = new AuthorNotificationRepository();
  await notificationRepository.recordSent({
    authorId: "a1700000-0000-4000-8000-000000000001",
    scheduleId: seeded.id
  });
  await notificationRepository.recordSent({
    authorId: "a1700000-0000-4000-8000-000000000001",
    scheduleId: seeded.id
  });
  assert.equal(notificationRepository.list().length, 1);
  assert.equal(notificationRepository.isEncryptedAtRest(), true);
});

test("service/controller/audit/redaction branches map expected outcomes", async () => {
  const scheduleRepository = new AuthorScheduleRepository({
    readConsistency: new ScheduleReadConsistency()
  });

  const seeded = scheduleRepository.seedSchedule({
    conferenceId: "c1800000-0000-4000-8000-000000000001",
    status: "FINAL",
    entries: [
      {
        paperId: "18000000-0000-4000-8000-000000000001",
        sessionId: "28000000-0000-4000-8000-000000000001",
        roomId: "38000000-0000-4000-8000-000000000001",
        timeSlotId: "48000000-0000-4000-8000-000000000001"
      }
    ],
    publication: {
      status: "PUBLISHED",
      publishedByEditorId: "e1800000-0000-4000-8000-000000000001",
      publishedAt: new Date()
    },
    acceptedPapersByAuthor: {
      "a1800000-0000-4000-8000-000000000001": ["18000000-0000-4000-8000-000000000001"]
    }
  });

  const auditRepository = new InMemoryScheduleAccessAuditRepository();
  const metrics = new InMemoryAuthorScheduleMetrics();

  const service = new AuthorScheduleService({
    scheduleRepository,
    notificationRepository: new AuthorNotificationRepository(),
    auditLogger: new ScheduleAccessAuditLogger({ repository: auditRepository }),
    metrics
  });

  const success = await service.getAuthorSchedule({
    authorUserId: "a1800000-0000-4000-8000-000000000001",
    requestId: "req-uc16-1"
  });
  assert.equal(success.outcome, "SCHEDULE_AVAILABLE");

  scheduleRepository.setPublicationStatus(seeded.id, "UNPUBLISHED");
  const unpublished = await service.getAuthorSchedule({
    authorUserId: "a1800000-0000-4000-8000-000000000001",
    requestId: "req-uc16-2"
  });
  assert.equal(unpublished.outcome, "SCHEDULE_NOT_PUBLISHED");

  const denied = await service.getAuthorSchedule({
    authorUserId: "a1800000-0000-4000-8000-000000000099",
    requestId: "req-uc16-3"
  });
  assert.equal(denied.outcome, "UNAVAILABLE_DENIED");

  const invalidInput = await service.getAuthorSchedule({
    authorUserId: "not-a-uuid",
    requestId: "req-uc16-3a"
  });
  assert.equal(invalidInput.outcome, "UNAVAILABLE_DENIED");

  const failingService = new AuthorScheduleService({
    scheduleRepository,
    notificationRepository: new AuthorNotificationRepository({ forceWriteFailure: true }),
    auditLogger: new ScheduleAccessAuditLogger({ repository: auditRepository }),
    metrics
  });

  scheduleRepository.setPublicationStatus(seeded.id, "PUBLISHED");
  const opFailure = await failingService.getAuthorSchedule({
    authorUserId: "a1800000-0000-4000-8000-000000000001",
    requestId: "req-uc16-4"
  });
  assert.equal(opFailure.outcome, "OPERATIONAL_FAILURE");

  const nonErrorFailureService = new AuthorScheduleService({
    scheduleRepository: {
      async getAuthorSchedule() {
        throw "non-error-failure";
      }
    } as any,
    notificationRepository: new AuthorNotificationRepository(),
    auditLogger: new ScheduleAccessAuditLogger({ repository: auditRepository }),
    metrics
  });

  const unknownFailure = await nonErrorFailureService.getAuthorSchedule({
    authorUserId: "a1800000-0000-4000-8000-000000000001",
    requestId: "req-uc16-4b"
  });
  assert.equal(unknownFailure.outcome, "OPERATIONAL_FAILURE");

  const handler = createGetAuthorScheduleHandler({ service });
  const unauthReply = createReplyDouble();
  await handler({ id: "req-handler-1", authorScheduleSession: undefined } as any, unauthReply as any);
  assert.equal(unauthReply.statusCode, 401);
  assert.equal(AuthorScheduleErrorSchema.safeParse(unauthReply.payload).success, true);

  const wrongRoleReply = createReplyDouble();
  await handler(
    {
      id: "req-handler-2",
      authorScheduleSession: {
        userId: "a1800000-0000-4000-8000-000000000001",
        sessionId: "sess",
        role: "EDITOR"
      }
    } as any,
    wrongRoleReply as any
  );
  assert.equal(wrongRoleReply.statusCode, 403);

  const okReply = createReplyDouble();
  await handler(
    {
      id: "req-handler-3",
      authorScheduleSession: {
        userId: "a1800000-0000-4000-8000-000000000001",
        sessionId: "sess",
        role: "AUTHOR"
      }
    } as any,
    okReply as any
  );
  assert.equal(okReply.statusCode, 200);
  assert.equal(AuthorScheduleResponseSchema.safeParse(okReply.payload).success, true);

  const fallbackHandler = createGetAuthorScheduleHandler({
    service: {
      async getAuthorSchedule() {
        return { outcome: "UNKNOWN_RESULT" } as any;
      }
    } as any
  });

  const fallbackReply = createReplyDouble();
  await fallbackHandler(
    {
      id: "req-handler-4",
      authorScheduleSession: {
        userId: "a1800000-0000-4000-8000-000000000001",
        sessionId: "sess",
        role: "AUTHOR"
      }
    } as any,
    fallbackReply as any
  );
  assert.equal(fallbackReply.statusCode, 503);

  const redacted = redactScheduleAccessLog({
    authorUserId: "a1800000-0000-4000-8000-000000000001",
    schedulePayload: { entries: [{ roomId: "x" }] },
    presentationDetails: [{ timeSlotId: "x" }],
    requestId: "req"
  });
  assert.equal(redacted.authorUserId, "[REDACTED]");
  assert.equal(redacted.schedulePayload, "[REDACTED]");

  const passwordRedacted = redactPasswordChangeLog({ password: "secret", untouched: "ok" });
  assert.equal(passwordRedacted.password, "[REDACTED]");
  assert.equal(passwordRedacted.untouched, "ok");

  const manuscriptRedacted = redactManuscriptSubmissionLog({
    title: "my paper",
    manuscriptDigest: "abc",
    safeKey: "visible"
  });
  assert.equal(manuscriptRedacted.title, "[REDACTED]");
  assert.equal(manuscriptRedacted.manuscriptDigest, "[REDACTED]");
  assert.equal(manuscriptRedacted.safeKey, "visible");

  const scheduleEditRedacted = redactScheduleEditLog({
    requestPayload: { entries: [] },
    sessionValue: "sensitive",
    safeKey: "visible"
  });
  assert.equal(scheduleEditRedacted.requestPayload, "[REDACTED]");
  assert.equal(scheduleEditRedacted.sessionValue, "[REDACTED]");
  assert.equal(scheduleEditRedacted.safeKey, "visible");

  assert.equal(metrics.success > 0, true);
  assert.equal(metrics.unpublished > 0, true);
  assert.equal(metrics.denied > 0, true);

  const events = auditRepository.list();
  assert.equal(events.length >= 4, true);
});
