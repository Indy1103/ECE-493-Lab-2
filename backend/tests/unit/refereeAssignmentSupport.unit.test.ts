import assert from "node:assert/strict";
import test from "node:test";

import { AssignRefereesUseCase } from "../../src/business/referee-assignments/AssignRefereesUseCase.js";
import { GetAssignmentOptionsUseCase } from "../../src/business/referee-assignments/GetAssignmentOptionsUseCase.js";
import {
  InMemoryInvitationDispatchAdapter,
  InvitationDispatchService
} from "../../src/business/referee-assignments/InvitationDispatchService.js";
import { PaperCapacityPolicyEvaluator } from "../../src/business/referee-assignments/PaperCapacityPolicyEvaluator.js";
import { WorkloadPolicyEvaluator } from "../../src/business/referee-assignments/WorkloadPolicyEvaluator.js";
import { validateAssignRefereesRequest } from "../../src/business/referee-assignments/refereeAssignmentSchemas.js";
import {
  PrismaRefereeAssignmentRepository,
  RefereeAssignmentConflictError
} from "../../src/data/referee-assignments/PrismaRefereeAssignmentRepository.js";
import {
  REFEREE_ASSIGNMENT_REPOSITORY_CONTRACT,
  type RefereeAssignmentRecord,
  type RefereeAssignmentRepository
} from "../../src/data/referee-assignments/RefereeAssignmentRepository.js";
import {
  mapAssignRefereesOutcome,
  mapGetAssignmentOptionsOutcome
} from "../../src/presentation/referee-assignments/refereeAssignmentErrorMapper.js";
import { createGetAssignmentOptionsHandler } from "../../src/presentation/referee-assignments/getAssignmentOptionsHandler.js";
import { createPostRefereeAssignmentsHandler } from "../../src/presentation/referee-assignments/postRefereeAssignmentsHandler.js";
import { requireRefereeAssignmentTransportSecurity } from "../../src/presentation/referee-assignments/refereeAssignmentRouteSecurity.js";
import {
  createEditorAssignmentGuard,
  type EditorSessionRecord,
  type EditorSessionRepository
} from "../../src/security/editorAssignmentGuard.js";
import {
  RefereeAssignmentAuditService,
  redactRefereeAssignmentAuditContext
} from "../../src/shared/audit/refereeAssignmentAudit.js";

const now = new Date("2026-03-02T00:00:00.000Z");

function createReplyDouble() {
  return {
    statusCode: 200,
    payload: undefined as unknown,
    headers: {} as Record<string, string>,
    header(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
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

function createRepoMock(overrides: Partial<RefereeAssignmentRepository>): RefereeAssignmentRepository {
  const base: RefereeAssignmentRepository = {
    withPaperLock: async (_paperId, operation) => operation(),
    getPaperCandidate: async () => null,
    listRefereeProfiles: async () => [],
    getAssignmentsByPaper: async () => [],
    findActiveAssignment: async () => null,
    createAssignments: async () => [],
    createInvitationIntent: async () => ({
      id: "inv-1",
      assignmentId: "assign-1",
      paperId: "paper-1",
      refereeId: "ref-1",
      invitationStatus: "PENDING",
      attemptCount: 0,
      lastAttemptAt: null,
      failureReasonCode: null,
      createdAt: now
    }),
    updateInvitationStatus: async () => {},
    listInvitationsByPaper: async () => [],
    listRetryableInvitations: async () => [],
    recordAudit: async () => {},
    snapshot: () => ({
      papers: [],
      referees: [],
      assignments: [],
      invitations: []
    }),
    restore: () => {},
    isEncryptedAtRest: () => true
  };

  return {
    ...base,
    ...overrides
  };
}

test("referee assignment schema validation handles invalid, duplicate, and valid payloads", () => {
  const invalid = validateAssignRefereesRequest({});
  assert.equal(invalid.valid, false);

  const duplicate = validateAssignRefereesRequest({
    refereeIds: ["ref-1", " ref-1 "]
  });
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.violations[0]?.rule, "DUPLICATE_REFEREE_IN_REQUEST");

  const valid = validateAssignRefereesRequest({
    refereeIds: [" ref-1 ", "ref-2"]
  });
  assert.equal(valid.valid, true);
  if (valid.valid) {
    assert.deepEqual(valid.refereeIds, ["ref-1", "ref-2"]);
  }
});

test("workload and capacity evaluators cover all policy branches", () => {
  const workload = new WorkloadPolicyEvaluator();
  const capacity = new PaperCapacityPolicyEvaluator();

  const workloadViolations = workload.evaluate({
    requestedRefereeIds: ["missing", "limit", "ok"],
    profilesById: new Map([
      [
        "limit",
        {
          refereeId: "limit",
          conferenceCycleId: "cycle-1",
          displayName: "At Limit",
          maxActiveAssignments: 2,
          currentActiveAssignments: 2,
          eligible: true
        }
      ],
      [
        "ok",
        {
          refereeId: "ok",
          conferenceCycleId: "cycle-1",
          displayName: "Eligible",
          maxActiveAssignments: 2,
          currentActiveAssignments: 1,
          eligible: true
        }
      ]
    ])
  });

  assert.deepEqual(
    workloadViolations.map((item) => item.rule).sort(),
    ["REFEREE_NOT_ASSIGNABLE", "REFEREE_WORKLOAD_LIMIT_REACHED"]
  );

  assert.equal(
    capacity.evaluate({
      paper: {
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "IN_REVIEW",
        maxRefereesPerPaper: 2
      },
      currentAssignedCount: 1,
      requestedCount: 1
    })[0]?.rule,
    "PAPER_NOT_AWAITING_ASSIGNMENT"
  );

  assert.equal(
    capacity.evaluate({
      paper: {
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "AWAITING_ASSIGNMENT",
        maxRefereesPerPaper: 1
      },
      currentAssignedCount: 1,
      requestedCount: 1
    })[0]?.rule,
    "PAPER_REFEREE_CAPACITY_REACHED"
  );

  assert.equal(
    capacity.evaluate({
      paper: {
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "AWAITING_ASSIGNMENT",
        maxRefereesPerPaper: 3
      },
      currentAssignedCount: 1,
      requestedCount: 1
    }).length,
    0
  );
});

test("invitation dispatch service covers dispatch and retry branches", async () => {
  const repository = new PrismaRefereeAssignmentRepository({ nowProvider: () => now });
  repository.seedPaperCandidate({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    workflowState: "AWAITING_ASSIGNMENT",
    maxRefereesPerPaper: 3
  });
  repository.seedRefereeProfile({
    refereeId: "ref-1",
    conferenceCycleId: "cycle-1",
    displayName: "R1",
    maxActiveAssignments: 3,
    currentActiveAssignments: 0,
    eligible: true
  });
  repository.seedRefereeProfile({
    refereeId: "ref-2",
    conferenceCycleId: "cycle-1",
    displayName: "R2",
    maxActiveAssignments: 3,
    currentActiveAssignments: 0,
    eligible: true
  });

  const assignments = await repository.createAssignments({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    editorId: "editor-1",
    refereeIds: ["ref-1", "ref-2"]
  });

  const adapter = new InMemoryInvitationDispatchAdapter({ "ref-2": 1 });
  adapter.setFailureBudget("ref-1", 0);

  const service = new InvitationDispatchService({
    repository,
    dispatchAdapter: adapter,
    maxRetryAttempts: 2,
    baseBackoffMs: 1
  });

  const statuses = await service.dispatchForAssignments(assignments);
  assert.equal(statuses.find((status) => status.refereeId === "ref-1")?.status, "SENT");
  assert.equal(statuses.find((status) => status.refereeId === "ref-2")?.status, "PENDING_RETRY");

  await service.retryFailedInvitations();

  const invitations = await repository.listInvitationsByPaper("paper-1");
  const retryInvitation = invitations.find((invitation) => invitation.refereeId === "ref-2");
  assert.equal(retryInvitation?.invitationStatus, "SENT");

  await repository.updateInvitationStatus({
    invitationId: retryInvitation?.id ?? "",
    status: "FAILED_RETRYABLE",
    failureReasonCode: "INVITATION_DELIVERY_FAILED",
    incrementAttempt: true
  });
  await repository.updateInvitationStatus({
    invitationId: retryInvitation?.id ?? "",
    status: "FAILED_RETRYABLE",
    failureReasonCode: undefined,
    incrementAttempt: false
  });
  await repository.updateInvitationStatus({
    invitationId: "missing",
    status: "FAILED_RETRYABLE",
    incrementAttempt: true
  });

  adapter.setFailureBudget("ref-2", 5);
  await service.retryFailedInvitations();

  const final = (await repository.listInvitationsByPaper("paper-1")).find(
    (invitation) => invitation.refereeId === "ref-2"
  );
  assert.equal(final?.invitationStatus, "FAILED_RETRYABLE");

  const extraAssignment = (await repository.createAssignments({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    editorId: "editor-1",
    refereeIds: ["ref-3"]
  }))[0] as RefereeAssignmentRecord;

  const extraInvitation = await repository.createInvitationIntent({
    assignmentId: extraAssignment.id,
    paperId: extraAssignment.paperId,
    refereeId: extraAssignment.refereeId
  });
  await repository.updateInvitationStatus({
    invitationId: extraInvitation.id,
    status: "FAILED_RETRYABLE",
    failureReasonCode: "INVITATION_DELIVERY_FAILED",
    incrementAttempt: false
  });

  adapter.setFailureBudget("ref-3", 1);
  await service.retryFailedInvitations();

  const extraAfterRetry = (await repository.listInvitationsByPaper("paper-1")).find(
    (invitation) => invitation.id === extraInvitation.id
  );
  assert.equal(extraAfterRetry?.invitationStatus, "FAILED_RETRYABLE");
  assert.equal(extraAfterRetry?.failureReasonCode, "INVITATION_DELIVERY_FAILED");
});

test("error mapper default branches return internal fallback payloads", () => {
  const getNotFound = mapGetAssignmentOptionsOutcome({
    outcome: "PAPER_NOT_FOUND",
    code: "PAPER_NOT_FOUND",
    message: "missing"
  });
  assert.equal(getNotFound.statusCode, 404);

  const getNotAssignable = mapGetAssignmentOptionsOutcome({
    outcome: "PAPER_NOT_ASSIGNABLE",
    code: "PAPER_NOT_ASSIGNABLE",
    message: "not-assignable"
  });
  assert.equal(getNotAssignable.statusCode, 404);

  const getInternal = mapGetAssignmentOptionsOutcome({
    outcome: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "error"
  });
  assert.equal(getInternal.statusCode, 500);

  const postNotFound = mapAssignRefereesOutcome({
    outcome: "PAPER_NOT_FOUND",
    code: "PAPER_NOT_FOUND",
    message: "missing"
  });
  assert.equal(postNotFound.statusCode, 404);

  const postNotAssignable = mapAssignRefereesOutcome({
    outcome: "PAPER_NOT_ASSIGNABLE",
    code: "PAPER_NOT_ASSIGNABLE",
    message: "not-assignable"
  });
  assert.equal(postNotAssignable.statusCode, 404);

  const postConflict = mapAssignRefereesOutcome({
    outcome: "ASSIGNMENT_CONFLICT",
    code: "ASSIGNMENT_CONFLICT",
    message: "conflict"
  });
  assert.equal(postConflict.statusCode, 409);

  const postInternal = mapAssignRefereesOutcome({
    outcome: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "error"
  });
  assert.equal(postInternal.statusCode, 500);

  const getMapped = mapGetAssignmentOptionsOutcome({ outcome: "UNREACHABLE" } as never);
  assert.equal(getMapped.statusCode, 500);
  assert.equal(getMapped.body.code, "INTERNAL_ERROR");

  const postMapped = mapAssignRefereesOutcome({ outcome: "UNREACHABLE" } as never);
  assert.equal(postMapped.statusCode, 500);
  assert.equal(postMapped.body.code, "INTERNAL_ERROR");
});

test("get assignment options use case covers not-found, not-assignable, and internal branches", async () => {
  const notFoundUseCase = new GetAssignmentOptionsUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => null
    })
  });

  const notFound = await notFoundUseCase.execute({ paperId: "paper-1" });
  assert.equal(notFound.outcome, "PAPER_NOT_FOUND");

  const notAssignableUseCase = new GetAssignmentOptionsUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => ({
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "IN_REVIEW",
        maxRefereesPerPaper: 2
      })
    })
  });

  const notAssignable = await notAssignableUseCase.execute({ paperId: "paper-1" });
  assert.equal(notAssignable.outcome, "PAPER_NOT_ASSIGNABLE");

  const internalUseCase = new GetAssignmentOptionsUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => {
        throw new Error("boom");
      }
    })
  });

  const internal = await internalUseCase.execute({ paperId: "paper-1" });
  assert.equal(internal.outcome, "INTERNAL_ERROR");
});

test("assign referees use case covers validation, conflict, and internal recovery branches", async () => {
  const recorded: string[] = [];
  const restored: string[] = [];

  const auditService = new RefereeAssignmentAuditService({
    repository: {
      recordAudit: async (input) => {
        recorded.push(input.outcome);
      }
    }
  });

  const validationUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({}),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const validation = await validationUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-1",
    body: { invalid: true }
  });
  assert.equal(validation.outcome, "VALIDATION_FAILED");

  const paperNotFoundUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => null
    }),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const paperNotFound = await paperNotFoundUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-1b",
    body: { refereeIds: ["ref-1"] }
  });
  assert.equal(paperNotFound.outcome, "PAPER_NOT_FOUND");

  const conflictUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({
      withPaperLock: async () => {
        throw new RefereeAssignmentConflictError();
      }
    }),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const conflict = await conflictUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-2",
    body: { refereeIds: ["ref-1"] }
  });
  assert.equal(conflict.outcome, "ASSIGNMENT_CONFLICT");

  const notAssignableUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => ({
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "IN_REVIEW",
        maxRefereesPerPaper: 2
      })
    }),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const notAssignable = await notAssignableUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-2b",
    body: { refereeIds: ["ref-1"] }
  });
  assert.equal(notAssignable.outcome, "PAPER_NOT_ASSIGNABLE");

  const existingAssignmentUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({
      getPaperCandidate: async () => ({
        paperId: "paper-1",
        conferenceCycleId: "cycle-1",
        workflowState: "AWAITING_ASSIGNMENT",
        maxRefereesPerPaper: 2
      }),
      listRefereeProfiles: async () => [
        {
          refereeId: "ref-1",
          conferenceCycleId: "cycle-1",
          displayName: "Ref",
          maxActiveAssignments: 2,
          currentActiveAssignments: 0,
          eligible: true
        }
      ],
      findActiveAssignment: async () => ({
        id: "assign-1",
        paperId: "paper-1",
        refereeId: "ref-1",
        assignedByEditorId: "editor-1",
        assignmentStatus: "ASSIGNED",
        assignedAt: now,
        conferenceCycleId: "cycle-1"
      })
    }),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const existingAssignment = await existingAssignmentUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-2c",
    body: { refereeIds: ["ref-1"] }
  });
  assert.equal(existingAssignment.outcome, "VALIDATION_FAILED");

  const failingRepo = createRepoMock({
    getPaperCandidate: async () => ({
      paperId: "paper-1",
      conferenceCycleId: "cycle-1",
      workflowState: "AWAITING_ASSIGNMENT",
      maxRefereesPerPaper: 2
    }),
    listRefereeProfiles: async () => [
      {
        refereeId: "ref-1",
        conferenceCycleId: "cycle-1",
        displayName: "Ref",
        maxActiveAssignments: 2,
        currentActiveAssignments: 0,
        eligible: true
      }
    ],
    snapshot: () => ({
      papers: [],
      referees: [],
      assignments: [],
      invitations: []
    }),
    createAssignments: async () => {
      throw new Error("create-failed");
    },
    restore: () => {
      restored.push("restore");
    }
  });

  const internalUseCase = new AssignRefereesUseCase({
    repository: failingRepo,
    invitationDispatchService: new InvitationDispatchService({
      repository: failingRepo,
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const internal = await internalUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-3",
    body: { refereeIds: ["ref-1"] }
  });

  assert.equal(internal.outcome, "INTERNAL_ERROR");
  assert.deepEqual(restored, ["restore"]);

  const thrownUseCase = new AssignRefereesUseCase({
    repository: createRepoMock({
      withPaperLock: async () => {
        throw new Error("unexpected");
      }
    }),
    invitationDispatchService: new InvitationDispatchService({
      repository: createRepoMock({}),
      dispatchAdapter: new InMemoryInvitationDispatchAdapter()
    }),
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  const thrown = await thrownUseCase.execute({
    paperId: "paper-1",
    editorId: "editor-1",
    requestId: "req-4",
    body: { refereeIds: ["ref-1"] }
  });

  assert.equal(thrown.outcome, "INTERNAL_ERROR");
  assert.equal(recorded.length >= 4, true);
});

test("prisma referee repository utility branches and contract marker are covered", async () => {
  assert.equal(REFEREE_ASSIGNMENT_REPOSITORY_CONTRACT.includes("V1"), true);

  const repository = new PrismaRefereeAssignmentRepository({ nowProvider: () => now });
  repository.setForceLockConflict(false);
  repository.seedPaperCandidate({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    workflowState: "AWAITING_ASSIGNMENT",
    maxRefereesPerPaper: 2
  });
  repository.seedRefereeProfile({
    refereeId: "ref-1",
    conferenceCycleId: "cycle-1",
    displayName: "Ref",
    maxActiveAssignments: 2,
    currentActiveAssignments: 0,
    eligible: true
  });

  await assert.rejects(async () => {
    const conflictRepo = new PrismaRefereeAssignmentRepository({ forceLockConflict: true });
    await conflictRepo.withPaperLock("paper-1", async () => "never");
  }, RefereeAssignmentConflictError);

  await assert.rejects(async () => {
    await repository.withPaperLock("paper-1", async () => {
      throw new Error("lock-operation-failed");
    });
  });

  await repository.withPaperLock("paper-branch", async () => {
    (repository as unknown as { activeLocks: Map<string, number> }).activeLocks.delete("paper-branch");
    return "ok";
  });

  assert.equal(await repository.getPaperCandidate("missing"), null);
  assert.equal(repository.getMaxObservedPaperConcurrency("missing"), 0);
  assert.equal((await repository.getAssignmentsByPaper("missing")).length, 0);
  assert.equal(await repository.findActiveAssignment("paper-1", "missing"), null);

  const missingProfileAssignment = await repository.createAssignments({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    editorId: "editor-1",
    refereeIds: ["missing-profile"]
  });
  assert.equal(missingProfileAssignment.length, 1);

  const assignment = (await repository.createAssignments({
    paperId: "paper-1",
    conferenceCycleId: "cycle-1",
    editorId: "editor-1",
    refereeIds: ["ref-1"]
  }))[0] as RefereeAssignmentRecord;
  const found = await repository.findActiveAssignment("paper-1", "ref-1");
  assert.equal(found?.refereeId, "ref-1");

  const invitation = await repository.createInvitationIntent({
    assignmentId: assignment.id,
    paperId: assignment.paperId,
    refereeId: assignment.refereeId
  });
  await repository.updateInvitationStatus({
    invitationId: invitation.id,
    status: "FAILED_RETRYABLE",
    incrementAttempt: true
  });

  await repository.recordAudit({
    requestId: "req-1",
    paperId: "paper-1",
    editorId: "editor-1",
    submittedRefereeIdsCount: 1,
    outcome: "SUCCESS",
    reasonCode: "ASSIGNMENT_COMMITTED"
  });
  assert.equal(repository.getAuditRows().length, 1);

  assert.equal((await repository.listRetryableInvitations()).length, 1);

  const snapshot = repository.snapshot();
  repository.restore(snapshot);
  assert.equal(repository.isEncryptedAtRest(), true);
});

test("editor guard and route transport security cover success and rejection branches", async () => {
  class SessionRepo implements EditorSessionRepository {
    constructor(private readonly session: EditorSessionRecord | null) {}

    async getSessionById(): Promise<EditorSessionRecord | null> {
      return this.session;
    }
  }

  const guardMissing = createEditorAssignmentGuard({ sessionRepository: new SessionRepo(null) });
  const requestMissing = {
    headers: {}
  } as never;
  const replyMissing = createReplyDouble();
  await guardMissing(requestMissing, replyMissing as never);
  assert.equal(replyMissing.statusCode, 401);

  const replyNoSessionCookie = createReplyDouble();
  await guardMissing(
    {
      headers: {
        cookie: "foo=bar"
      }
    } as never,
    replyNoSessionCookie as never
  );
  assert.equal(replyNoSessionCookie.statusCode, 401);

  const replyEmptySessionCookie = createReplyDouble();
  await guardMissing(
    {
      headers: {
        cookie: "cms_session="
      }
    } as never,
    replyEmptySessionCookie as never
  );
  assert.equal(replyEmptySessionCookie.statusCode, 401);

  const guardInvalid = createEditorAssignmentGuard({
    sessionRepository: new SessionRepo({
      sessionId: "s1",
      accountId: "editor-1",
      role: "AUTHOR",
      status: "ACTIVE"
    })
  });
  const requestInvalid = {
    headers: {
      cookie: "foo=bar; cms_session=s1"
    }
  } as never;
  const replyInvalid = createReplyDouble();
  await guardInvalid(requestInvalid, replyInvalid as never);
  assert.equal(replyInvalid.statusCode, 403);

  const guardExpired = createEditorAssignmentGuard({
    sessionRepository: new SessionRepo({
      sessionId: "s1",
      accountId: "editor-1",
      role: "EDITOR",
      status: "EXPIRED"
    })
  });
  const requestExpired = {
    headers: {
      cookie: "cms_session=s1"
    }
  } as never;
  const replyExpired = createReplyDouble();
  await guardExpired(requestExpired, replyExpired as never);
  assert.equal(replyExpired.statusCode, 401);

  const guardSuccess = createEditorAssignmentGuard({
    sessionRepository: new SessionRepo({
      sessionId: "s2",
      accountId: "editor-2",
      role: "EDITOR",
      status: "ACTIVE"
    })
  });
  const requestSuccess = {
    headers: {
      cookie: "x=1; cms_session=s2"
    }
  } as never;
  const replySuccess = createReplyDouble();
  await guardSuccess(requestSuccess, replySuccess as never);
  assert.equal((requestSuccess as { editorAuth?: { editorId: string } }).editorAuth?.editorId, "editor-2");

  const securityReply = createReplyDouble();
  await requireRefereeAssignmentTransportSecurity(
    {
      headers: {
        "x-forwarded-proto": "https"
      },
      id: "req-1"
    } as never,
    securityReply as never
  );
  assert.equal(securityReply.statusCode, 200);
});

test("referee assignment handlers return 401 when editor context is missing", async () => {
  const getHandler = createGetAssignmentOptionsHandler({
    useCase: {
      execute: async () => ({
        outcome: "PAPER_NOT_FOUND",
        code: "PAPER_NOT_FOUND",
        message: "missing"
      })
    }
  });
  const getReply = createReplyDouble();
  await getHandler(
    {
      id: "req-get",
      params: { paperId: "paper-1" }
    } as never,
    getReply as never
  );
  assert.equal(getReply.statusCode, 401);

  const postHandler = createPostRefereeAssignmentsHandler({
    useCase: {
      execute: async () => ({
        outcome: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "error"
      })
    }
  });
  const postReply = createReplyDouble();
  await postHandler(
    {
      id: "req-post",
      params: { paperId: "paper-1" },
      body: {}
    } as never,
    postReply as never
  );
  assert.equal(postReply.statusCode, 401);

  let receivedBody: unknown = "not-set";
  const postSuccessHandler = createPostRefereeAssignmentsHandler({
    useCase: {
      execute: async (input) => {
        receivedBody = input.body;
        return {
          outcome: "SUCCESS",
          paperId: "paper-1",
          assignedRefereeIds: [],
          invitationStatuses: [],
          message: "Referees assigned successfully."
        };
      }
    }
  });
  const postSuccessReply = createReplyDouble();
  await postSuccessHandler(
    {
      id: "req-post-success",
      params: { paperId: "paper-1" },
      body: undefined,
      editorAuth: {
        editorId: "editor-1",
        sessionId: "sess-1"
      }
    } as never,
    postSuccessReply as never
  );
  assert.deepEqual(receivedBody, {});
  assert.equal(postSuccessReply.statusCode, 200);
});

test("referee assignment audit service redaction and emit/no-emit paths execute", async () => {
  const redacted = redactRefereeAssignmentAuditContext({
    displayName: "Sensitive",
    currentWorkload: 5,
    reasonCode: "VALIDATION_FAILED"
  });

  assert.equal(redacted.displayName, "[REDACTED]");
  assert.equal(redacted.currentWorkload, "[REDACTED]");
  assert.equal(redacted.reasonCode, "VALIDATION_FAILED");

  const emitted: Array<Record<string, unknown>> = [];
  const serviceWithEmit = new RefereeAssignmentAuditService({
    repository: {
      recordAudit: async () => {}
    },
    emit: (event) => {
      emitted.push(event);
    }
  });

  await serviceWithEmit.recordOutcome({
    requestId: "req-1",
    paperId: "paper-1",
    editorId: "editor-1",
    submittedRefereeIdsCount: 2,
    outcome: "SUCCESS",
    reasonCode: "ASSIGNMENT_COMMITTED"
  });

  assert.equal(emitted.length, 1);

  const serviceWithoutEmit = new RefereeAssignmentAuditService({
    repository: {
      recordAudit: async () => {}
    }
  });

  await serviceWithoutEmit.recordOutcome({
    requestId: "req-2",
    paperId: "paper-1",
    editorId: null,
    submittedRefereeIdsCount: 0,
    outcome: "AUTHN_FAILED",
    reasonCode: "AUTHN_FAILED"
  });
});
