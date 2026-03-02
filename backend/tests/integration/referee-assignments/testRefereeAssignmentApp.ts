import Fastify, { type FastifyInstance } from "fastify";

import { AssignRefereesUseCase } from "../../../src/business/referee-assignments/AssignRefereesUseCase.js";
import { GetAssignmentOptionsUseCase } from "../../../src/business/referee-assignments/GetAssignmentOptionsUseCase.js";
import {
  InMemoryInvitationDispatchAdapter,
  InvitationDispatchService
} from "../../../src/business/referee-assignments/InvitationDispatchService.js";
import { PaperCapacityPolicyEvaluator } from "../../../src/business/referee-assignments/PaperCapacityPolicyEvaluator.js";
import { WorkloadPolicyEvaluator } from "../../../src/business/referee-assignments/WorkloadPolicyEvaluator.js";
import { PrismaRefereeAssignmentRepository } from "../../../src/data/referee-assignments/PrismaRefereeAssignmentRepository.js";
import { createRefereeAssignmentRoutes } from "../../../src/presentation/referee-assignments/refereeAssignmentRoutes.js";
import {
  type EditorSessionRecord,
  type EditorSessionRepository,
  createEditorAssignmentGuard
} from "../../../src/security/editorAssignmentGuard.js";
import { RefereeAssignmentAuditService } from "../../../src/shared/audit/refereeAssignmentAudit.js";

interface RefereeAssignmentTestAppOptions {
  includeSession?: boolean;
  sessionRole?: string;
  sessionStatus?: "ACTIVE" | "REVOKED" | "EXPIRED";
  seedPaper?: boolean;
  paperWorkflowState?: "AWAITING_ASSIGNMENT" | "IN_REVIEW" | "CLOSED";
  maxRefereesPerPaper?: number;
  preAssignedRefereeIds?: string[];
  invitationFailureBudgetByReferee?: Record<string, number>;
  maxRetryAttempts?: number;
  forceLockConflict?: boolean;
}

class InMemoryEditorSessionRepository implements EditorSessionRepository {
  private readonly sessions = new Map<string, EditorSessionRecord>();

  async getSessionById(sessionId: string): Promise<EditorSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async seedSession(record: EditorSessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, { ...record });
  }
}

export interface RefereeAssignmentTestAppContext {
  app: FastifyInstance;
  repository: PrismaRefereeAssignmentRepository;
  sessionRepository: InMemoryEditorSessionRepository;
  invitationDispatchService: InvitationDispatchService;
  auditEvents: Array<Record<string, unknown>>;
  sessionId: string;
  editorId: string;
  paperId: string;
  conferenceCycleId: string;
  refereeIds: {
    r1: string;
    r2: string;
    atLimit: string;
    ineligible: string;
    unknown: string;
  };
}

export async function createRefereeAssignmentTestApp(
  options: RefereeAssignmentTestAppOptions = {}
): Promise<RefereeAssignmentTestAppContext> {
  const app = Fastify({ logger: false, genReqId: () => "req_ref_assign_test" });

  const sessionId = "sess_uc07_editor_001";
  const editorId = "20000000-0000-4000-8000-000000000701";
  const paperId = "30000000-0000-4000-8000-000000000701";
  const conferenceCycleId = "40000000-0000-4000-8000-000000000701";

  const refereeIds = {
    r1: "50000000-0000-4000-8000-000000000701",
    r2: "50000000-0000-4000-8000-000000000702",
    atLimit: "50000000-0000-4000-8000-000000000703",
    ineligible: "50000000-0000-4000-8000-000000000704",
    unknown: "50000000-0000-4000-8000-000000000799"
  };

  const sessionRepository = new InMemoryEditorSessionRepository();

  if (options.includeSession !== false) {
    await sessionRepository.seedSession({
      sessionId,
      accountId: editorId,
      role: options.sessionRole ?? "EDITOR",
      status: options.sessionStatus ?? "ACTIVE"
    });
  }

  const repository = new PrismaRefereeAssignmentRepository({
    forceLockConflict: options.forceLockConflict ?? false
  });

  if (options.seedPaper !== false) {
    repository.seedPaperCandidate({
      paperId,
      conferenceCycleId,
      workflowState: options.paperWorkflowState ?? "AWAITING_ASSIGNMENT",
      maxRefereesPerPaper: options.maxRefereesPerPaper ?? 2
    });
  }

  repository.seedRefereeProfile({
    refereeId: refereeIds.r1,
    conferenceCycleId,
    displayName: "Referee One",
    maxActiveAssignments: 2,
    currentActiveAssignments: 0,
    eligible: true
  });

  repository.seedRefereeProfile({
    refereeId: refereeIds.r2,
    conferenceCycleId,
    displayName: "Referee Two",
    maxActiveAssignments: 2,
    currentActiveAssignments: 1,
    eligible: true
  });

  repository.seedRefereeProfile({
    refereeId: refereeIds.atLimit,
    conferenceCycleId,
    displayName: "Referee At Limit",
    maxActiveAssignments: 2,
    currentActiveAssignments: 2,
    eligible: true
  });

  repository.seedRefereeProfile({
    refereeId: refereeIds.ineligible,
    conferenceCycleId,
    displayName: "Referee Ineligible",
    maxActiveAssignments: 2,
    currentActiveAssignments: 0,
    eligible: false
  });

  if ((options.preAssignedRefereeIds ?? []).length > 0) {
    await repository.createAssignments({
      paperId,
      conferenceCycleId,
      editorId,
      refereeIds: options.preAssignedRefereeIds ?? []
    });
  }

  const adapter = new InMemoryInvitationDispatchAdapter(options.invitationFailureBudgetByReferee ?? {});
  const invitationDispatchService = new InvitationDispatchService({
    repository,
    dispatchAdapter: adapter,
    maxRetryAttempts: options.maxRetryAttempts ?? 3,
    baseBackoffMs: 1
  });

  const auditEvents: Array<Record<string, unknown>> = [];
  const auditService = new RefereeAssignmentAuditService({
    repository,
    emit: (event) => {
      auditEvents.push(event);
    }
  });

  const getOptionsUseCase = new GetAssignmentOptionsUseCase({ repository });
  const assignRefereesUseCase = new AssignRefereesUseCase({
    repository,
    invitationDispatchService,
    workloadPolicyEvaluator: new WorkloadPolicyEvaluator(),
    paperCapacityPolicyEvaluator: new PaperCapacityPolicyEvaluator(),
    auditService
  });

  app.register(
    createRefereeAssignmentRoutes({
      getOptionsUseCase,
      assignRefereesUseCase,
      editorAssignmentGuard: createEditorAssignmentGuard({ sessionRepository })
    })
  );

  await app.ready();

  return {
    app,
    repository,
    sessionRepository,
    invitationDispatchService,
    auditEvents,
    sessionId,
    editorId,
    paperId,
    conferenceCycleId,
    refereeIds
  };
}
