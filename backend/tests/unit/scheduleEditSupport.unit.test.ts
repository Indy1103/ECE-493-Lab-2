import assert from "node:assert/strict";
import test from "node:test";

import { ScheduleEditService } from "../../src/business/schedules/scheduleEditService.js";
import { validateScheduleEdits } from "../../src/business/schedules/scheduleEditValidator.js";
import {
  assertScheduleCanBeUpdated
} from "../../src/data/schedules/scheduleConcurrency.js";
import { ScheduleModificationRepository } from "../../src/data/schedules/scheduleModificationRepository.js";
import { ScheduleRepository } from "../../src/data/schedules/scheduleRepository.js";
import {
  createGetScheduleHandler,
  createPutScheduleHandler
} from "../../src/presentation/controllers/scheduleController.js";
import {
  createEditorScheduleSessionGuard,
  ensureEditorRole
} from "../../src/security/guards/editorGuard.js";
import { InMemoryScheduleAuditRepository, ScheduleAuditLogger } from "../../src/shared/audit/scheduleAudit.js";
import { redactScheduleEditLog } from "../../src/shared/logging/redaction.js";
import { InMemoryScheduleMetrics } from "../../src/shared/metrics/scheduleMetrics.js";
import {
  ScheduleFinalizedError,
  ScheduleVersionConflictError
} from "../../src/shared/errors/scheduleErrors.js";

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

function createServiceFixture() {
  const scheduleRepository = new ScheduleRepository();
  const modificationRepository = new ScheduleModificationRepository();
  const auditRepository = new InMemoryScheduleAuditRepository();
  const metrics = new InMemoryScheduleMetrics();

  const seeded = scheduleRepository.seedSchedule({
    conferenceId: "c2000000-0000-4000-8000-000000000001",
    editorIds: ["e2000000-0000-4000-8000-000000000001"],
    updatedByEditorId: "e2000000-0000-4000-8000-000000000001",
    entries: [
      {
        paperId: "12000000-0000-4000-8000-000000000001",
        sessionId: "22000000-0000-4000-8000-000000000001",
        roomId: "32000000-0000-4000-8000-000000000001",
        timeSlotId: "42000000-0000-4000-8000-000000000001"
      }
    ],
    referenceCatalog: {
      sessionIds: ["22000000-0000-4000-8000-000000000001"],
      roomIds: ["32000000-0000-4000-8000-000000000001"],
      timeSlotIds: ["42000000-0000-4000-8000-000000000001"]
    }
  });

  const service = new ScheduleEditService({
    scheduleRepository,
    scheduleModificationRepository: modificationRepository,
    auditLogger: new ScheduleAuditLogger({ repository: auditRepository }),
    metrics
  });

  return {
    service,
    scheduleRepository,
    modificationRepository,
    auditRepository,
    metrics,
    seeded,
    conferenceId: seeded.conferenceId,
    editorId: "e2000000-0000-4000-8000-000000000001"
  };
}

test("validator reports violations for unknown references and allows valid references", () => {
  const valid = validateScheduleEdits({
    existingEntries: [
      {
        paperId: "paper-1",
        sessionId: "session-1",
        roomId: "room-1",
        timeSlotId: "slot-1"
      }
    ],
    requestedEntries: [
      {
        paperId: "paper-1",
        sessionId: "session-1",
        roomId: "room-1",
        timeSlotId: "slot-1"
      }
    ],
    references: {
      sessionIds: new Set(["session-1"]),
      roomIds: new Set(["room-1"]),
      timeSlotIds: new Set(["slot-1"])
    }
  });

  assert.equal(valid.length, 0);

  const invalid = validateScheduleEdits({
    existingEntries: [
      {
        paperId: "paper-1",
        sessionId: "session-1",
        roomId: "room-1",
        timeSlotId: "slot-1"
      }
    ],
    requestedEntries: [
      {
        paperId: "paper-9",
        sessionId: "session-9",
        roomId: "room-9",
        timeSlotId: "slot-9"
      }
    ],
    references: {
      sessionIds: new Set(["session-1"]),
      roomIds: new Set(["room-1"]),
      timeSlotIds: new Set(["slot-1"])
    }
  });

  assert.equal(invalid.length, 4);
});

test("concurrency helper throws finalized and version conflict errors", () => {
  assert.throws(
    () =>
      assertScheduleCanBeUpdated({
        expectedVersion: 1,
        current: {
          status: "FINAL",
          version: 1
        }
      }),
    (error: unknown) => error instanceof ScheduleFinalizedError
  );

  assert.throws(
    () =>
      assertScheduleCanBeUpdated({
        expectedVersion: 1,
        current: {
          status: "DRAFT",
          version: 2
        }
      }),
    (error: unknown) => error instanceof ScheduleVersionConflictError
  );

  assert.doesNotThrow(() =>
    assertScheduleCanBeUpdated({
      expectedVersion: 3,
      current: {
        status: "DRAFT",
        version: 3
      }
    })
  );
});

test("repository covers unavailable/unauthorized and encryption at rest branches", async () => {
  const repository = new ScheduleRepository();

  const schedule = repository.seedSchedule({
    conferenceId: "c3000000-0000-4000-8000-000000000001",
    editorIds: ["e3000000-0000-4000-8000-000000000001"],
    updatedByEditorId: "e3000000-0000-4000-8000-000000000001",
    entries: [
      {
        paperId: "p3000000-0000-4000-8000-000000000001",
        sessionId: "s3000000-0000-4000-8000-000000000001",
        roomId: "r3000000-0000-4000-8000-000000000001",
        timeSlotId: "t3000000-0000-4000-8000-000000000001"
      }
    ]
  });

  assert.equal((await repository.getScheduleForEditor(schedule.conferenceId, "wrong-editor")), null);
  assert.equal((await repository.getReferenceCatalog("missing-conference")), null);

  const applied = await repository.applyEdits({
    conferenceId: schedule.conferenceId,
    editorId: "wrong-editor",
    scheduleId: schedule.id,
    expectedVersion: 1,
    entries: []
  });
  assert.equal(applied, null);

  assert.equal(repository.isEncryptedAtRest(), true);
});

test("schedule edit service covers unavailable, invalid, finalized, conflict, and success outcomes", async () => {
  const fixture = createServiceFixture();

  const unavailable = await fixture.service.getSchedule({
    conferenceId: fixture.conferenceId,
    editorUserId: "e2000000-0000-4000-8000-000000000099",
    requestId: "req-1"
  });
  assert.equal(unavailable.outcome, "UNAVAILABLE_DENIED");

  const invalidSchema = await fixture.service.updateSchedule({
    conferenceId: fixture.conferenceId,
    editorUserId: fixture.editorId,
    requestId: "req-2",
    payload: { scheduleId: "bad", entries: [] }
  });
  assert.equal(invalidSchema.outcome, "INVALID_MODIFICATIONS");

  const invalidReferences = await fixture.service.updateSchedule({
    conferenceId: fixture.conferenceId,
    editorUserId: fixture.editorId,
    requestId: "req-3",
    payload: {
      scheduleId: fixture.seeded.id,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000099",
          sessionId: "22000000-0000-4000-8000-000000000001",
          roomId: "32000000-0000-4000-8000-000000000001",
          timeSlotId: "42000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(invalidReferences.outcome, "INVALID_MODIFICATIONS");

  const success = await fixture.service.updateSchedule({
    conferenceId: fixture.conferenceId,
    editorUserId: fixture.editorId,
    requestId: "req-4",
    payload: {
      scheduleId: fixture.seeded.id,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000001",
          sessionId: "22000000-0000-4000-8000-000000000001",
          roomId: "32000000-0000-4000-8000-000000000001",
          timeSlotId: "42000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(success.outcome, "SCHEDULE_UPDATED");

  const finalized = await fixture.service.updateSchedule({
    conferenceId: fixture.conferenceId,
    editorUserId: fixture.editorId,
    requestId: "req-5",
    payload: {
      scheduleId: fixture.seeded.id,
      entries: [
        {
          paperId: "12000000-0000-4000-8000-000000000001",
          sessionId: "22000000-0000-4000-8000-000000000001",
          roomId: "32000000-0000-4000-8000-000000000001",
          timeSlotId: "42000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(finalized.outcome, "SCHEDULE_ALREADY_FINAL");

  const conflictService = new ScheduleEditService({
    scheduleRepository: {
      async withScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async getScheduleForEditor() {
        return {
          id: "00000000-0000-4000-8000-000000000001",
          conferenceId: "10000000-0000-4000-8000-000000000001",
          status: "DRAFT" as const,
          updatedAt: new Date(),
          updatedByEditorId: "editor-1",
          version: 1,
          entries: [
            {
              id: "entry-1",
              paperId: "20000000-0000-4000-8000-000000000001",
              sessionId: "30000000-0000-4000-8000-000000000001",
              roomId: "40000000-0000-4000-8000-000000000001",
              timeSlotId: "50000000-0000-4000-8000-000000000001"
            }
          ]
        };
      },
      async getReferenceCatalog() {
        return {
          sessionIds: new Set(["30000000-0000-4000-8000-000000000001"]),
          roomIds: new Set(["40000000-0000-4000-8000-000000000001"]),
          timeSlotIds: new Set(["50000000-0000-4000-8000-000000000001"])
        };
      },
      async applyEdits() {
        throw new ScheduleVersionConflictError();
      }
    },
    scheduleModificationRepository: fixture.modificationRepository,
    auditLogger: new ScheduleAuditLogger({ repository: fixture.auditRepository }),
    metrics: fixture.metrics
  });

  const conflict = await conflictService.updateSchedule({
    conferenceId: "10000000-0000-4000-8000-000000000001",
    editorUserId: "60000000-0000-4000-8000-000000000001",
    requestId: "req-6",
    payload: {
      scheduleId: "00000000-0000-4000-8000-000000000001",
      entries: [
        {
          paperId: "20000000-0000-4000-8000-000000000001",
          sessionId: "30000000-0000-4000-8000-000000000001",
          roomId: "40000000-0000-4000-8000-000000000001",
          timeSlotId: "50000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });

  assert.equal(conflict.outcome, "CONFLICT");

  assert.equal(fixture.metrics.success > 0, true);
  assert.equal(fixture.metrics.conflicts > 0, true);
  assert.equal(fixture.auditRepository.list().length > 0, true);
});

test("controller handlers cover session/auth branches and successful mapping", async () => {
  const service = {
    async getSchedule() {
      return {
        outcome: "SCHEDULE_RETRIEVED" as const,
        statusCode: 200 as const,
        schedule: {
          id: "00000000-0000-4000-8000-000000000001",
          conferenceId: "10000000-0000-4000-8000-000000000001",
          status: "DRAFT" as const,
          entries: []
        }
      };
    },
    async updateSchedule() {
      return {
        outcome: "SCHEDULE_UPDATED" as const,
        statusCode: 200 as const,
        message: "ok",
        schedule: {
          id: "00000000-0000-4000-8000-000000000001",
          conferenceId: "10000000-0000-4000-8000-000000000001",
          status: "FINAL" as const,
          entries: []
        }
      };
    }
  };

  const getHandler = createGetScheduleHandler({ service });
  const putHandler = createPutScheduleHandler({ service });

  const missingReply = createReplyDouble();
  await getHandler(
    {
      conferenceScheduleSession: undefined,
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      id: "req-1"
    } as never,
    missingReply as never
  );
  assert.equal(missingReply.statusCode, 401);

  const forbiddenReply = createReplyDouble();
  await getHandler(
    {
      conferenceScheduleSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "AUTHOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      id: "req-2"
    } as never,
    forbiddenReply as never
  );
  assert.equal(forbiddenReply.statusCode, 403);

  const successReply = createReplyDouble();
  await getHandler(
    {
      conferenceScheduleSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "EDITOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      id: "req-3"
    } as never,
    successReply as never
  );
  assert.equal(successReply.statusCode, 200);

  const unavailableGetHandler = createGetScheduleHandler({
    service: {
      ...service,
      async getSchedule() {
        return {
          outcome: "UNAVAILABLE_DENIED" as const,
          statusCode: 404 as const,
          code: "UNAVAILABLE_DENIED" as const,
          message: "Conference schedule is unavailable for this conference."
        };
      }
    }
  });

  const unavailableGetReply = createReplyDouble();
  await unavailableGetHandler(
    {
      conferenceScheduleSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "EDITOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      id: "req-unavailable-get"
    } as never,
    unavailableGetReply as never
  );
  assert.equal(unavailableGetReply.statusCode, 404);

  const putReply = createReplyDouble();
  await putHandler(
    {
      conferenceScheduleSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "EDITOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      body: {
        scheduleId: "00000000-0000-4000-8000-000000000001",
        entries: []
      },
      id: "req-4"
    } as never,
    putReply as never
  );
  assert.equal(putReply.statusCode, 200);

  const putMissingReply = createReplyDouble();
  await putHandler(
    {
      conferenceScheduleSession: undefined,
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      body: {},
      id: "req-5"
    } as never,
    putMissingReply as never
  );
  assert.equal(putMissingReply.statusCode, 401);

  const putForbiddenReply = createReplyDouble();
  await putHandler(
    {
      conferenceScheduleSession: {
        userId: "author-1",
        sessionId: "session-1",
        role: "AUTHOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      body: {},
      id: "req-6"
    } as never,
    putForbiddenReply as never
  );
  assert.equal(putForbiddenReply.statusCode, 403);

  const fallbackPutHandler = createPutScheduleHandler({
    service: {
      ...service,
      async updateSchedule() {
        return { outcome: "UNKNOWN" } as never;
      }
    }
  });

  const fallbackReply = createReplyDouble();
  await fallbackPutHandler(
    {
      conferenceScheduleSession: {
        userId: "editor-1",
        sessionId: "session-1",
        role: "EDITOR"
      },
      params: { conferenceId: "10000000-0000-4000-8000-000000000001" },
      body: {},
      id: "req-7"
    } as never,
    fallbackReply as never
  );
  assert.equal(fallbackReply.statusCode, 500);
});

test("editor role guard and redaction helper cover remaining branches", () => {
  const reply = createReplyDouble();

  assert.equal(ensureEditorRole("EDITOR", reply as never), true);
  assert.equal(ensureEditorRole("AUTHOR", reply as never), false);
  assert.equal(reply.statusCode, 403);

  const redacted = redactScheduleEditLog({
    requestPayload: { test: true },
    scheduleId: "id-1",
    sessionId: "session-1",
    roomId: "room-1",
    timeSlotId: "slot-1",
    safe: "value"
  });

  assert.equal(redacted.requestPayload, "[REDACTED]");
  assert.equal(redacted.scheduleId, "[REDACTED]");
  assert.equal(redacted.safe, "value");
});

test("editor schedule session guard covers cookie parsing and invalid session branches", async () => {
  const sessions = new Map<
    string,
    {
      sessionId: string;
      accountId: string;
      role: string;
      status: "ACTIVE" | "REVOKED" | "EXPIRED";
    }
  >();

  sessions.set("active-session", {
    sessionId: "active-session",
    accountId: "editor-1",
    role: "EDITOR",
    status: "ACTIVE"
  });
  sessions.set("revoked-session", {
    sessionId: "revoked-session",
    accountId: "editor-2",
    role: "EDITOR",
    status: "REVOKED"
  });

  const guard = createEditorScheduleSessionGuard({
    sessionRepository: {
      async getSessionById(sessionId) {
        return sessions.get(sessionId) ?? null;
      }
    }
  });

  const validReply = createReplyDouble();
  const validRequest: {
    headers: { cookie: string };
    conferenceScheduleSession?: { role: string };
  } = {
    headers: { cookie: "foo=bar; session=active-session" },
    conferenceScheduleSession: undefined
  };

  await guard(validRequest as never, validReply as never);
  assert.equal(validReply.statusCode, 200);
  assert.equal(validRequest.conferenceScheduleSession!.role, "EDITOR");

  const revokedReply = createReplyDouble();
  await guard(
    {
      headers: { cookie: "session=revoked-session" },
      conferenceScheduleSession: undefined
    } as never,
    revokedReply as never
  );
  assert.equal(revokedReply.statusCode, 401);

  const missingReply = createReplyDouble();
  await guard(
    {
      headers: { cookie: "foo=bar" },
      conferenceScheduleSession: undefined
    } as never,
    missingReply as never
  );
  assert.equal(missingReply.statusCode, 401);
});

test("schedule modification repository handles missing completion and clones records", async () => {
  const repository = new ScheduleModificationRepository();
  await repository.complete("missing-request", "REJECTED");

  const started = await repository.begin({
    scheduleId: "10000000-0000-4000-8000-000000000001",
    requestedByEditorId: "20000000-0000-4000-8000-000000000001"
  });
  await repository.complete(started.id, "APPLIED");

  const records = repository.list();
  assert.equal(records.length, 1);
  assert.equal(records[0]?.status, "APPLIED");

  records[0]!.status = "REJECTED";
  assert.equal(repository.list()[0]?.status, "APPLIED");
});

test("schedule edit service handles apply-null and unexpected-error branches", async () => {
  const modificationRepository = new ScheduleModificationRepository();
  const auditRepository = new InMemoryScheduleAuditRepository();
  const metrics = new InMemoryScheduleMetrics();

  const scheduleRecord = {
    id: "10000000-0000-4000-8000-000000000001",
    conferenceId: "20000000-0000-4000-8000-000000000001",
    status: "DRAFT" as const,
    updatedAt: new Date(),
    updatedByEditorId: "30000000-0000-4000-8000-000000000001",
    version: 1,
    entries: [
      {
        id: "entry-1",
        paperId: "40000000-0000-4000-8000-000000000001",
        sessionId: "50000000-0000-4000-8000-000000000001",
        roomId: "60000000-0000-4000-8000-000000000001",
        timeSlotId: "70000000-0000-4000-8000-000000000001"
      }
    ]
  };

  const sharedDeps = {
    scheduleModificationRepository: modificationRepository,
    auditLogger: new ScheduleAuditLogger({ repository: auditRepository }),
    metrics
  };

  const unavailableService = new ScheduleEditService({
    scheduleRepository: {
      async withScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async getScheduleForEditor() {
        return null;
      },
      async getReferenceCatalog() {
        return null;
      },
      async applyEdits() {
        return null;
      }
    },
    ...sharedDeps
  });

  const unavailable = await unavailableService.updateSchedule({
    conferenceId: "20000000-0000-4000-8000-000000000001",
    editorUserId: "30000000-0000-4000-8000-000000000001",
    requestId: "req-no-existing",
    payload: {
      scheduleId: "10000000-0000-4000-8000-000000000001",
      entries: [
        {
          paperId: "40000000-0000-4000-8000-000000000001",
          sessionId: "50000000-0000-4000-8000-000000000001",
          roomId: "60000000-0000-4000-8000-000000000001",
          timeSlotId: "70000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(unavailable.outcome, "UNAVAILABLE_DENIED");

  const noReferenceService = new ScheduleEditService({
    scheduleRepository: {
      async withScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async getScheduleForEditor() {
        return scheduleRecord;
      },
      async getReferenceCatalog() {
        return null;
      },
      async applyEdits() {
        return null;
      }
    },
    ...sharedDeps
  });

  const noReferences = await noReferenceService.updateSchedule({
    conferenceId: "20000000-0000-4000-8000-000000000001",
    editorUserId: "30000000-0000-4000-8000-000000000001",
    requestId: "req-no-references",
    payload: {
      scheduleId: "10000000-0000-4000-8000-000000000001",
      entries: [
        {
          paperId: "40000000-0000-4000-8000-000000000001",
          sessionId: "50000000-0000-4000-8000-000000000001",
          roomId: "60000000-0000-4000-8000-000000000001",
          timeSlotId: "70000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(noReferences.outcome, "UNAVAILABLE_DENIED");

  const nullApplyService = new ScheduleEditService({
    scheduleRepository: {
      async withScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async getScheduleForEditor() {
        return scheduleRecord;
      },
      async getReferenceCatalog() {
        return {
          sessionIds: new Set(["50000000-0000-4000-8000-000000000001"]),
          roomIds: new Set(["60000000-0000-4000-8000-000000000001"]),
          timeSlotIds: new Set(["70000000-0000-4000-8000-000000000001"])
        };
      },
      async applyEdits() {
        return null;
      }
    },
    ...sharedDeps
  });

  const nullApply = await nullApplyService.updateSchedule({
    conferenceId: "20000000-0000-4000-8000-000000000001",
    editorUserId: "30000000-0000-4000-8000-000000000001",
    requestId: "req-null",
    payload: {
      scheduleId: "10000000-0000-4000-8000-000000000001",
      entries: [
        {
          paperId: "40000000-0000-4000-8000-000000000001",
          sessionId: "50000000-0000-4000-8000-000000000001",
          roomId: "60000000-0000-4000-8000-000000000001",
          timeSlotId: "70000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(nullApply.outcome, "UNAVAILABLE_DENIED");

  const throwService = new ScheduleEditService({
    scheduleRepository: {
      async withScheduleLock(_conferenceId, operation) {
        return operation();
      },
      async getScheduleForEditor() {
        return scheduleRecord;
      },
      async getReferenceCatalog() {
        return {
          sessionIds: new Set(["50000000-0000-4000-8000-000000000001"]),
          roomIds: new Set(["60000000-0000-4000-8000-000000000001"]),
          timeSlotIds: new Set(["70000000-0000-4000-8000-000000000001"])
        };
      },
      async applyEdits() {
        throw new Error("boom");
      }
    },
    ...sharedDeps
  });

  const unexpected = await throwService.updateSchedule({
    conferenceId: "20000000-0000-4000-8000-000000000001",
    editorUserId: "30000000-0000-4000-8000-000000000001",
    requestId: "req-throw",
    payload: {
      scheduleId: "10000000-0000-4000-8000-000000000001",
      entries: [
        {
          paperId: "40000000-0000-4000-8000-000000000001",
          sessionId: "50000000-0000-4000-8000-000000000001",
          roomId: "60000000-0000-4000-8000-000000000001",
          timeSlotId: "70000000-0000-4000-8000-000000000001"
        }
      ]
    }
  });
  assert.equal(unexpected.outcome, "UNAVAILABLE_DENIED");
});
