import argon2 from "argon2";

import { LoginFailureUseCase } from "./business/auth/login-failure.use-case.js";
import { RolePolicyService } from "./business/auth/role-policy.js";
import { LoginSuccessUseCase } from "./business/auth/login-success.use-case.js";
import { LoginThrottlePolicy } from "./business/auth/throttle-policy.js";
import {
  REVIEW_SUBMISSION_OUTCOMES,
  REVIEW_SUBMISSION_REASON_CODES
} from "./business/review-submission/submission-outcome.js";
import { REVIEW_VISIBILITY_OUTCOMES } from "./business/review-visibility/visibility-outcome.js";
import { FINAL_DECISION_OUTCOMES } from "./business/final-decision/decision-outcome.js";
import { AUTHOR_DECISION_OUTCOMES } from "./business/author-decision/decision-outcome.js";
import { CONFERENCE_SCHEDULE_OUTCOMES } from "./business/conference-schedule/schedule-outcome.js";
import { REFEREE_ACCESS_OUTCOMES } from "./shared/accessOutcomes.js";
import { SCHEDULE_ERROR_CODES } from "./shared/errors/scheduleErrors.js";
import { SCHEDULE_ACCESS_ERROR_CODES } from "./shared/errors/scheduleAccessErrors.js";
import type { ConferenceAnnouncement } from "./business/ports/conferenceAnnouncementRepository.js";
import { RegisterUserUseCase } from "./business/registration/registerUser.js";
import { PublicAnnouncementService } from "./business/services/publicAnnouncementService.js";
import { DefaultRegistrationPriceService } from "./business/services/registrationPriceService.js";
import { InMemoryLoginThrottleRepository } from "./data/auth/login-throttle.repository.prisma.js";
import type {
  AuthAccount,
  AuthDataProtectionSnapshot,
  AuthenticatedSession,
  AuthRepository,
  CreateSessionInput,
  LoginAttemptRecord
} from "./data/auth/auth.repository.js";
import type { SessionRecord } from "./data/security/session.repository.js";
import {
  InMemoryRegistrationPriceRepository,
  type RegistrationPriceListRow
} from "./data/repositories/registrationPriceRepository.js";
import { InMemoryRegistrationThrottleRepository } from "./data/repositories/registrationThrottleRepository.js";
import { InMemoryUserAccountRepository } from "./data/repositories/userAccountRepository.js";
import { buildServer } from "./presentation/http/server.js";
import { createLoginRoutes } from "./presentation/auth/login.routes.js";
import { createPublicRegistrationRoute } from "./presentation/routes/publicRegistrationRoute.js";
import { createPublicRoutes } from "./presentation/routes/publicRoutes.js";
import { createPasswordChangeRoute } from "./presentation/account/password-change.controller.js";
import { createSessionAuthMiddleware } from "./presentation/middleware/session-auth.js";
import { createAuthorSessionAuth } from "./presentation/middleware/author-session-auth.js";
import { createManuscriptSubmissionsRoute } from "./presentation/manuscripts/manuscript-submissions.controller.js";
import { createSubmissionDraftRoutes } from "./presentation/submission-drafts/submissionDraftRoutes.js";
import { createRefereeAssignmentRoutes } from "./presentation/referee-assignments/refereeAssignmentRoutes.js";
import { createReviewInvitationRoutes } from "./presentation/review-invitations/reviewInvitationRoutes.js";
import { createRefereeAccessRoutes } from "./presentation/referee-access/refereeAccessRoutes.js";
import { createReviewSubmissionRoutes } from "./presentation/review-submission/routes.js";
import { createReviewVisibilityRoutes } from "./presentation/review-visibility/routes.js";
import { createFinalDecisionRoutes } from "./presentation/final-decision/routes.js";
import { createAuthorDecisionRoutes } from "./presentation/author-decision/routes.js";
import { createConferenceScheduleRoutes } from "./presentation/conference-schedule/routes.js";
import { createEditorRoutes } from "./presentation/routes/editorRoutes.js";
import { createAuthorRoutes } from "./presentation/routes/authorRoutes.js";
import { Argon2PasswordVerifier } from "./security/auth/password-verifier.js";
import { createEditorAssignmentGuard } from "./security/editorAssignmentGuard.js";
import { createReviewInvitationAuthorization } from "./security/reviewInvitationAuthorization.js";
import { createRefereeSessionGuard } from "./security/sessionGuard.js";
import {
  createAuthorDecisionSessionGuard,
  createConferenceScheduleSessionGuard,
  createFinalDecisionSessionGuard,
  createReviewSubmissionSessionGuard,
  createReviewVisibilitySessionGuard
} from "./security/session-guard.js";
import { createAuthorScheduleSessionGuard } from "./security/guards/authorGuard.js";
import { createEditorScheduleSessionGuard } from "./security/guards/editorGuard.js";
import { createRegistrationMetrics } from "./shared/observability/registrationMetrics.js";
import { createRegistrationTelemetry } from "./shared/observability/registrationTelemetry.js";
import { createLoginObservability } from "./shared/observability/login-observability.js";
import { RegistrationThrottleService } from "./business/registration/registrationThrottleService.js";

const DEMO_PASSWORD = "Passw0rd88";

const DEMO_IDS = {
  conferenceId: "00000000-0000-4000-8000-000000000701",
  scheduleId: "00000000-0000-4000-8000-000000000702",
  paperId: "00000000-0000-4000-8000-000000000301",
  submissionId: "00000000-0000-4000-8000-000000000201",
  invitationId: "00000000-0000-4000-8000-000000000401",
  assignmentId: "00000000-0000-4000-8000-000000000501",
  sessionId: "00000000-0000-4000-8000-000000000801",
  roomId: "00000000-0000-4000-8000-000000000802",
  timeSlotId: "00000000-0000-4000-8000-000000000803",
  cycleId: "00000000-0000-4000-8000-000000000901",
  adminId: "00000000-0000-4000-8000-000000000101",
  editorId: "00000000-0000-4000-8000-000000000102",
  authorId: "00000000-0000-4000-8000-000000000103",
  refereeId: "00000000-0000-4000-8000-000000000104",
  registeredUserId: "00000000-0000-4000-8000-000000000105"
} as const;

type DemoRole = "ADMIN" | "EDITOR" | "AUTHOR" | "REFEREE" | "REGISTERED_USER";

interface DemoUserSeed {
  id: string;
  username: string;
  role: DemoRole;
}

const DEMO_USERS: DemoUserSeed[] = [
  { id: DEMO_IDS.adminId, username: "admin.ava", role: "ADMIN" },
  { id: DEMO_IDS.editorId, username: "editor.jane", role: "EDITOR" },
  { id: DEMO_IDS.authorId, username: "author.alex", role: "AUTHOR" },
  { id: DEMO_IDS.refereeId, username: "referee.riley", role: "REFEREE" },
  { id: DEMO_IDS.registeredUserId, username: "user.uma", role: "REGISTERED_USER" }
];

interface DemoSessionRecord {
  sessionId: string;
  accountId: string;
  role: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  issuedAt: Date;
}

class DemoSessionStore {
  private readonly sessions = new Map<string, DemoSessionRecord>();
  private readonly requestSessionIndex = new Map<string, string>();
  private sequence = 900;

  async seed(session: DemoSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, { ...session });
  }

  async createSession(input: CreateSessionInput): Promise<AuthenticatedSession> {
    this.sequence += 1;
    const sessionId = `00000000-0000-4000-8000-${String(this.sequence).padStart(12, "0")}`;
    const record: DemoSessionRecord = {
      sessionId,
      accountId: input.userId,
      role: input.role,
      status: "ACTIVE",
      issuedAt: input.now
    };

    this.sessions.set(sessionId, record);
    this.requestSessionIndex.set(input.requestId, sessionId);

    return {
      sessionId,
      userId: input.userId,
      role: input.role,
      issuedAt: input.now,
      expiresAt: new Date(input.now.getTime() + 1000 * 60 * 60 * 12),
      lastActivityAt: input.now,
      requestId: input.requestId,
      status: "ACTIVE"
    };
  }

  async getSessionById(sessionId: string): Promise<DemoSessionRecord | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async revokeAllByAccount(accountId: string, _now: Date): Promise<void> {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.accountId !== accountId || session.status !== "ACTIVE") {
        continue;
      }
      this.sessions.set(sessionId, {
        ...session,
        status: "REVOKED"
      });
    }
  }

  snapshot(): SessionRecord[] {
    return Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.sessionId,
      accountId: session.accountId,
      status: session.status
    }));
  }

  restore(snapshot: SessionRecord[]): void {
    this.sessions.clear();
    for (const session of snapshot) {
      const role =
        DEMO_USERS.find((user) => user.id === session.accountId)?.role ?? "REGISTERED_USER";

      this.sessions.set(session.sessionId, {
        sessionId: session.sessionId,
        accountId: session.accountId,
        role,
        status: session.status,
        issuedAt: new Date()
      });
    }
  }

  getSessionForRequestId(requestId: string): DemoSessionRecord | null {
    const sessionId = this.requestSessionIndex.get(requestId);
    if (!sessionId) {
      return null;
    }
    return this.sessions.get(sessionId) ?? null;
  }

  getSeedSessionByAccount(accountId: string): DemoSessionRecord | null {
    for (const session of this.sessions.values()) {
      if (session.accountId === accountId) {
        return session;
      }
    }
    return null;
  }
}

class DemoAuthRepository implements AuthRepository {
  private readonly accountsByUsername = new Map<string, AuthAccount>();
  private readonly accountsById = new Map<string, AuthAccount>();
  private readonly attempts: LoginAttemptRecord[] = [];
  private snapshot: AuthDataProtectionSnapshot = {
    primaryRecordsEncrypted: true,
    backupsEncrypted: true
  };

  constructor(private readonly sessionStore: DemoSessionStore) {}

  async seedAccount(account: AuthAccount): Promise<void> {
    this.accountsByUsername.set(account.username.trim().toLowerCase(), { ...account });
    this.accountsById.set(account.id, { ...account });
  }

  async findAccountByUsername(username: string): Promise<AuthAccount | null> {
    return this.accountsByUsername.get(username.trim().toLowerCase()) ?? null;
  }

  findAccountById(accountId: string): AuthAccount | null {
    return this.accountsById.get(accountId) ?? null;
  }

  async updatePasswordHash(accountId: string, passwordHash: string): Promise<void> {
    const account = this.accountsById.get(accountId);
    if (!account) {
      return;
    }

    const updated: AuthAccount = {
      ...account,
      passwordHash
    };

    this.accountsById.set(accountId, updated);
    this.accountsByUsername.set(updated.username.trim().toLowerCase(), updated);
  }

  async createSession(input: CreateSessionInput): Promise<AuthenticatedSession> {
    return this.sessionStore.createSession(input);
  }

  async recordAttempt(attempt: LoginAttemptRecord): Promise<void> {
    this.attempts.push({ ...attempt });
  }

  async getDataProtectionSnapshot(): Promise<AuthDataProtectionSnapshot> {
    return { ...this.snapshot };
  }

  getSessionForRequestId(requestId: string): DemoSessionRecord | null {
    return this.sessionStore.getSessionForRequestId(requestId);
  }
}

class InMemoryConferenceAnnouncementRepository {
  constructor(private readonly announcements: ConferenceAnnouncement[]) {}

  async findEligibleAnnouncements(now: Date): Promise<ConferenceAnnouncement[]> {
    const eligible = this.announcements.filter((announcement) => {
      const startsOnOrBeforeNow = announcement.publishStart.getTime() <= now.getTime();
      const endsOnOrAfterNow =
        announcement.publishEnd === null || announcement.publishEnd.getTime() >= now.getTime();
      return announcement.isPublic && startsOnOrBeforeNow && endsOnOrAfterNow;
    });

    return eligible.sort(
      (left, right) => right.publishStart.getTime() - left.publishStart.getTime()
    );
  }
}

const announcementRepository = new InMemoryConferenceAnnouncementRepository([
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Keynote Speaker Announced",
    content: "The keynote speaker lineup is now published.",
    isPublic: true,
    publishStart: new Date("2026-01-10T12:00:00.000Z"),
    publishEnd: null
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Camera-ready Deadline Reminder",
    content: "Camera-ready submissions close on March 15, 2026.",
    isPublic: true,
    publishStart: new Date("2026-02-20T12:00:00.000Z"),
    publishEnd: new Date("2026-04-01T00:00:00.000Z")
  }
]);

const registrationRepository = new InMemoryRegistrationPriceRepository();
const publishedPriceList: RegistrationPriceListRow = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Standard Conference 2026",
  status: "PUBLISHED",
  publishedAt: new Date("2026-02-25T09:00:00.000Z"),
  effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
  effectiveTo: new Date("2026-06-30T00:00:00.000Z"),
  prices: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      attendanceType: "Student",
      amount: 199,
      currency: "USD"
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      attendanceType: "Regular",
      amount: 399,
      currency: "USD"
    }
  ]
};
registrationRepository.setPublishedPriceList(publishedPriceList);

const announcementService = new PublicAnnouncementService(announcementRepository);
const registrationPriceService = new DefaultRegistrationPriceService(registrationRepository);
const registrationMetrics = createRegistrationMetrics();
const registrationTelemetry = createRegistrationTelemetry({
  metrics: registrationMetrics
});
const registrationThrottleRepository = new InMemoryRegistrationThrottleRepository();
const registrationThrottle = new RegistrationThrottleService(registrationThrottleRepository);
const registrationUsers = new InMemoryUserAccountRepository();
const registerUser = new RegisterUserUseCase({
  userRepository: registrationUsers,
  throttleService: registrationThrottle,
  telemetry: registrationTelemetry
});

const sessionStore = new DemoSessionStore();
const loginRepository = new DemoAuthRepository(sessionStore);
const loginThrottleRepository = new InMemoryLoginThrottleRepository();
const loginObservability = createLoginObservability();
const loginThrottlePolicy = new LoginThrottlePolicy(loginThrottleRepository);
const demoRolePolicy = {
  resolveHomePath(role: string): string | null {
    const map: Record<string, string> = {
      ADMIN: "/admin/home",
      EDITOR: "/editor/home",
      AUTHOR: "/author/home",
      REFEREE: "/referee/home",
      REVIEWER: "/reviewer/home",
      REGISTERED_USER: "/home"
    };
    return map[role] ?? null;
  },
  hasPermission(role: string, permission: string): boolean {
    const permissions: Record<string, string[]> = {
      ADMIN: ["manage_schedule", "manage_system"],
      EDITOR: ["assign_referees", "record_decisions", "edit_schedule"],
      AUTHOR: ["submit_manuscript", "view_decision", "view_schedule"],
      REFEREE: ["respond_invitation", "review_paper", "view_assignments"],
      REVIEWER: ["review_paper", "view_assignments"],
      REGISTERED_USER: ["view_profile"]
    };
    return (permissions[role] ?? []).includes(permission);
  }
} as RolePolicyService;

const loginSuccessUseCase = new LoginSuccessUseCase({
  repository: loginRepository,
  passwordVerifier: new Argon2PasswordVerifier(),
  rolePolicy: demoRolePolicy
});
const loginFailureUseCase = new LoginFailureUseCase({
  throttlePolicy: loginThrottlePolicy
});

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface DemoDraftRecord {
  authorId: string;
  title: string;
  draftPayload: Record<string, unknown>;
  lastSavedAt: string;
}

interface DemoInvitation {
  invitationId: string;
  paperId: string;
  paperTitle: string;
  paperSummary: string;
  refereeId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  responseDeadlineAt: string;
  reviewDueAt: string;
  assignmentId: string;
}

interface DemoAssignment {
  assignmentId: string;
  paperId: string;
  title: string;
  refereeId: string;
  status: "ACTIVE" | "UNAVAILABLE";
  reviewFormId: string;
}

interface DemoReview {
  assignmentId: string;
  reviewId: string;
  paperId: string;
  summary: string;
  scores: Record<string, unknown>;
  recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
  submittedAt: Date;
}

interface DemoDecision {
  paperId: string;
  decision: "ACCEPT" | "REJECT";
  decidedAt: string;
  notificationStatus: "NOTIFIED" | "NOTIFICATION_FAILED";
}

interface DemoSchedule {
  id: string;
  conferenceId: string;
  status: "DRAFT" | "FINAL";
  entries: Array<{
    paperId: string;
    sessionId: string;
    roomId: string;
    timeSlotId: string;
  }>;
}

interface DemoState {
  drafts: Map<string, DemoDraftRecord>;
  manuscriptOwners: Map<string, string>;
  invitations: Map<string, DemoInvitation>;
  assignments: Map<string, DemoAssignment>;
  reviewsByPaper: Map<string, DemoReview[]>;
  decisionsByPaper: Map<string, DemoDecision>;
  paperTitles: Map<string, string>;
  paperOwners: Map<string, string>;
  schedule: DemoSchedule;
  submissionCounter: number;
  reviewCounter: number;
  invitationCounter: number;
  assignmentCounter: number;
  authorSchedulePublished: boolean;
}

const demoState: DemoState = {
  drafts: new Map<string, DemoDraftRecord>(),
  manuscriptOwners: new Map<string, string>(),
  invitations: new Map<string, DemoInvitation>(),
  assignments: new Map<string, DemoAssignment>(),
  reviewsByPaper: new Map<string, DemoReview[]>(),
  decisionsByPaper: new Map<string, DemoDecision>(),
  paperTitles: new Map<string, string>([[DEMO_IDS.paperId, "A Sample Manuscript"]]),
  paperOwners: new Map<string, string>([[DEMO_IDS.paperId, DEMO_IDS.authorId]]),
  schedule: {
    id: DEMO_IDS.scheduleId,
    conferenceId: DEMO_IDS.conferenceId,
    status: "FINAL" as const,
    entries: [
      {
        paperId: DEMO_IDS.paperId,
        sessionId: DEMO_IDS.sessionId,
        roomId: DEMO_IDS.roomId,
        timeSlotId: DEMO_IDS.timeSlotId
      }
    ]
  },
  submissionCounter: 300,
  reviewCounter: 400,
  invitationCounter: 500,
  assignmentCounter: 600,
  authorSchedulePublished: true
};

function nextDeterministicUuid(counter: number): string {
  return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function ensureAssignmentForInvitation(invitation: DemoInvitation): DemoAssignment {
  const existing = demoState.assignments.get(invitation.assignmentId);
  if (existing) {
    return existing;
  }

  const created: DemoAssignment = {
    assignmentId: invitation.assignmentId,
    paperId: invitation.paperId,
    title: invitation.paperTitle,
    refereeId: invitation.refereeId,
    status: "ACTIVE",
    reviewFormId: "review-form-v1"
  };

  demoState.assignments.set(created.assignmentId, created);
  return created;
}

const defaultInvitation: DemoInvitation = {
  invitationId: DEMO_IDS.invitationId,
  paperId: DEMO_IDS.paperId,
  paperTitle: "A Sample Manuscript",
  paperSummary: "Demonstration manuscript used for end-to-end UC walkthroughs.",
  refereeId: DEMO_IDS.refereeId,
  status: "PENDING",
  responseDeadlineAt: new Date("2026-03-30T23:59:59.000Z").toISOString(),
  reviewDueAt: new Date("2026-04-15T23:59:59.000Z").toISOString(),
  assignmentId: DEMO_IDS.assignmentId
};

demoState.invitations.set(defaultInvitation.invitationId, { ...defaultInvitation });
demoState.assignments.set(DEMO_IDS.assignmentId, {
  assignmentId: DEMO_IDS.assignmentId,
  paperId: DEMO_IDS.paperId,
  title: "A Sample Manuscript",
  refereeId: DEMO_IDS.refereeId,
  status: "ACTIVE",
  reviewFormId: "review-form-v1"
});
demoState.reviewsByPaper.set(DEMO_IDS.paperId, [
  {
    assignmentId: DEMO_IDS.assignmentId,
    reviewId: "00000000-0000-4000-8000-000000000981",
    paperId: DEMO_IDS.paperId,
    summary: "Strong submission with clear evaluation.",
    scores: { originality: 4, technicalQuality: 4, relevance: 5 },
    recommendation: "ACCEPT",
    submittedAt: new Date("2026-03-01T18:00:00.000Z")
  }
]);
demoState.decisionsByPaper.set(DEMO_IDS.paperId, {
  paperId: DEMO_IDS.paperId,
  decision: "ACCEPT",
  decidedAt: new Date("2026-03-02T10:00:00.000Z").toISOString(),
  notificationStatus: "NOTIFIED"
});
demoState.manuscriptOwners.set(DEMO_IDS.submissionId, DEMO_IDS.authorId);
demoState.drafts.set(DEMO_IDS.submissionId, {
  authorId: DEMO_IDS.authorId,
  title: "Draft Title",
  draftPayload: {
    abstract: "Draft abstract",
    keywords: ["conference", "demo"]
  },
  lastSavedAt: new Date("2026-03-02T12:00:00.000Z").toISOString()
});

const changePasswordService = {
  async execute(input: {
    accountId: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<Record<string, unknown>> {
    const violations: Array<{ field: string; rule: string; message: string }> = [];

    if (input.newPassword.trim().length < 12) {
      violations.push({
        field: "newPassword",
        rule: "min_length",
        message: "New password must be at least 12 characters long."
      });
    }

    if (input.newPassword !== input.confirmNewPassword) {
      violations.push({
        field: "confirmNewPassword",
        rule: "must_match",
        message: "New password confirmation does not match."
      });
    }

    if (violations.length > 0) {
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Password change request validation failed.",
        violations
      };
    }

    const account = loginRepository.findAccountById(input.accountId);
    if (!account) {
      return {
        outcome: "CONFLICT",
        code: "SESSION_INVALID",
        message: "Session is invalid or expired."
      };
    }

    const currentPasswordValid = await argon2.verify(account.passwordHash, input.currentPassword);
    if (!currentPasswordValid) {
      return {
        outcome: "CONFLICT",
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Current password is incorrect."
      };
    }

    const nextPasswordHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id
    });

    await loginRepository.updatePasswordHash(input.accountId, nextPasswordHash);

    return {
      outcome: "SUCCESS",
      message: "Password changed successfully."
    };
  }
};

const manuscriptSubmissionService = {
  async getRequirements(): Promise<Record<string, unknown>> {
    return {
      outcome: "REQUIREMENTS_AVAILABLE",
      cycleId: DEMO_IDS.cycleId,
      intakeStatus: "OPEN",
      metadataPolicyVersion: "CMS Metadata Policy v1.0",
      requiredMetadataFields: [
        "title",
        "abstract",
        "keywords",
        "fullAuthorList",
        "correspondingAuthorEmail",
        "primarySubjectArea"
      ],
      fileConstraints: {
        allowedMediaTypes: ["application/pdf"],
        maxBytes: 10 * 1024 * 1024
      }
    };
  },
  async submit(input: {
    authorId: string;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const body = input.body;
    const metadata = body.metadata;
    const manuscriptFile = body.manuscriptFile;

    if (!metadata || typeof metadata !== "object" || !manuscriptFile || typeof manuscriptFile !== "object") {
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Submission payload is invalid.",
        violations: [
          {
            field: "metadata",
            rule: "required",
            message: "Submission metadata is required."
          }
        ]
      };
    }

    const existingId = DEMO_IDS.submissionId;
    demoState.manuscriptOwners.set(existingId, input.authorId);

    return {
      outcome: "SUCCESS",
      submissionId: existingId,
      status: "SUBMITTED",
      message: "Manuscript submitted successfully."
    };
  }
};

const draftSaveUseCase = {
  async execute(input: {
    authorId: string;
    submissionId: string;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const body = input.body;

    if (typeof body.title !== "string" || typeof body.draftPayload !== "object" || body.draftPayload === null) {
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Draft validation failed.",
        violations: [
          {
            field: "title",
            rule: "required",
            message: "Title is required."
          }
        ]
      };
    }

    const nowIso = new Date().toISOString();
    demoState.drafts.set(input.submissionId, {
      authorId: input.authorId,
      title: body.title,
      draftPayload: body.draftPayload as Record<string, unknown>,
      lastSavedAt: nowIso
    });

    return {
      outcome: "SUCCESS",
      submissionId: input.submissionId,
      savedAt: nowIso,
      message: "Draft saved successfully."
    };
  }
};

const draftGetUseCase = {
  async execute(input: {
    authorId: string;
    submissionId: string;
  }): Promise<Record<string, unknown>> {
    const draft = demoState.drafts.get(input.submissionId);

    if (!draft) {
      return {
        outcome: "DRAFT_NOT_FOUND",
        code: "DRAFT_NOT_FOUND",
        message: "Draft was not found."
      };
    }

    if (draft.authorId !== input.authorId) {
      return {
        outcome: "AUTHORIZATION_FAILED",
        code: "AUTHORIZATION_FAILED",
        message: "Draft does not belong to the authenticated author."
      };
    }

    return {
      outcome: "SUCCESS",
      submissionId: input.submissionId,
      title: draft.title,
      draftPayload: draft.draftPayload,
      lastSavedAt: draft.lastSavedAt
    };
  }
};

const refereeOptionsUseCase = {
  async execute(input: { paperId: string }): Promise<Record<string, unknown>> {
    const paperTitle = demoState.paperTitles.get(input.paperId);
    if (!paperTitle) {
      return {
        outcome: "PAPER_NOT_FOUND",
        code: "PAPER_NOT_FOUND",
        message: "Paper was not found."
      };
    }

    const assignedCount = Array.from(demoState.assignments.values()).filter(
      (assignment) => assignment.paperId === input.paperId
    ).length;

    return {
      outcome: "SUCCESS",
      paperId: input.paperId,
      currentAssignedCount: assignedCount,
      remainingSlots: Math.max(0, 3 - assignedCount),
      maxRefereesPerPaper: 3,
      candidateReferees: [
        {
          refereeId: DEMO_IDS.refereeId,
          displayName: "Riley Referee",
          currentWorkload: 1,
          maxWorkload: 4,
          eligible: true
        },
        {
          refereeId: "00000000-0000-4000-8000-000000000106",
          displayName: "Casey Reviewer",
          currentWorkload: 0,
          maxWorkload: 4,
          eligible: true
        }
      ]
    };
  }
};

const assignRefereesUseCase = {
  async execute(input: {
    paperId: string;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const paperTitle = demoState.paperTitles.get(input.paperId);
    if (!paperTitle) {
      return {
        outcome: "PAPER_NOT_FOUND",
        code: "PAPER_NOT_FOUND",
        message: "Paper was not found."
      };
    }

    const refereeIds =
      typeof input.body === "object" && input.body && Array.isArray((input.body as any).refereeIds)
        ? ((input.body as any).refereeIds as unknown[]).filter((entry) => typeof entry === "string")
        : [];

    if (refereeIds.length === 0) {
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Assignment validation failed.",
        violations: [
          {
            rule: "AT_LEAST_ONE_REFEREE",
            message: "At least one referee must be selected."
          }
        ]
      };
    }

    const invitationStatuses: Array<{ refereeId: string; status: "SENT" | "PENDING_RETRY" }> = [];

    for (const refereeId of refereeIds) {
      const existingAssignment = Array.from(demoState.assignments.values()).find(
        (assignment) => assignment.paperId === input.paperId && assignment.refereeId === refereeId
      );

      let assignmentId = existingAssignment?.assignmentId;
      if (!assignmentId) {
        demoState.assignmentCounter += 1;
        assignmentId =
          refereeId === DEMO_IDS.refereeId
            ? DEMO_IDS.assignmentId
            : nextDeterministicUuid(demoState.assignmentCounter);

        demoState.assignments.set(assignmentId, {
          assignmentId,
          paperId: input.paperId,
          title: paperTitle,
          refereeId,
          status: "ACTIVE",
          reviewFormId: "review-form-v1"
        });
      }

      const existingInvitation = Array.from(demoState.invitations.values()).find(
        (invitation) => invitation.paperId === input.paperId && invitation.refereeId === refereeId
      );

      if (!existingInvitation) {
        demoState.invitationCounter += 1;
        const invitationId =
          refereeId === DEMO_IDS.refereeId
            ? DEMO_IDS.invitationId
            : nextDeterministicUuid(demoState.invitationCounter);

        demoState.invitations.set(invitationId, {
          invitationId,
          paperId: input.paperId,
          paperTitle,
          paperSummary: "Invitation generated from referee assignment.",
          refereeId,
          status: "PENDING",
          responseDeadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          reviewDueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
          assignmentId
        });
      }

      invitationStatuses.push({ refereeId, status: "SENT" });
    }

    return {
      outcome: "SUCCESS",
      paperId: input.paperId,
      assignedRefereeIds: refereeIds,
      invitationStatuses,
      message: "Referees assigned successfully."
    };
  }
};

const getReviewInvitationUseCase = {
  async execute(input: {
    invitationId: string;
    refereeId: string;
  }): Promise<Record<string, unknown>> {
    const invitation = demoState.invitations.get(input.invitationId);

    if (!invitation) {
      return {
        outcome: "INVITATION_NOT_FOUND",
        code: "INVITATION_NOT_FOUND",
        message: "Review invitation was not found."
      };
    }

    if (invitation.refereeId !== input.refereeId) {
      return {
        outcome: "AUTHORIZATION_FAILED",
        code: "AUTHORIZATION_FAILED",
        message: "Invitation does not belong to the authenticated referee."
      };
    }

    return {
      outcome: "SUCCESS",
      invitationId: invitation.invitationId,
      paperId: invitation.paperId,
      paperTitle: invitation.paperTitle,
      paperSummary: invitation.paperSummary,
      reviewDueAt: invitation.reviewDueAt,
      responseDeadlineAt: invitation.responseDeadlineAt,
      status: invitation.status
    };
  }
};

const respondToReviewInvitationUseCase = {
  async execute(input: {
    invitationId: string;
    refereeId: string;
    body: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const invitation = demoState.invitations.get(input.invitationId);

    if (!invitation) {
      return {
        outcome: "INVITATION_NOT_FOUND",
        code: "INVITATION_NOT_FOUND",
        message: "Review invitation was not found."
      };
    }

    if (invitation.refereeId !== input.refereeId) {
      return {
        outcome: "AUTHORIZATION_FAILED",
        code: "AUTHORIZATION_FAILED",
        message: "Invitation does not belong to the authenticated referee."
      };
    }

    if (invitation.status !== "PENDING") {
      return {
        outcome: "INVITATION_ALREADY_RESOLVED",
        code: "INVITATION_ALREADY_RESOLVED",
        message: "Invitation has already been resolved by an earlier response."
      };
    }

    const decision = input.body?.decision;
    if (decision !== "ACCEPT" && decision !== "REJECT") {
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Invitation response validation failed.",
        violations: [
          {
            rule: "INVALID_DECISION_VALUE",
            message: "Decision must be either ACCEPT or REJECT."
          }
        ]
      };
    }

    invitation.status = decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";
    demoState.invitations.set(invitation.invitationId, invitation);

    let assignmentCreated = false;
    if (decision === "ACCEPT") {
      const assignment = ensureAssignmentForInvitation(invitation);
      if (assignment.status !== "ACTIVE") {
        assignment.status = "ACTIVE";
        assignmentCreated = true;
      }
      demoState.assignments.set(assignment.assignmentId, assignment);
    }

    return {
      outcome: "SUCCESS",
      invitationId: invitation.invitationId,
      decision,
      invitationStatus: invitation.status,
      assignmentCreated,
      message: "Your response has been recorded."
    };
  }
};

const listAssignmentsService = {
  async execute(input: { refereeUserId: string }): Promise<Record<string, unknown>> {
    const items = Array.from(demoState.assignments.values())
      .filter((assignment) => assignment.refereeId === input.refereeUserId)
      .map((assignment) => ({
        assignmentId: assignment.assignmentId,
        paperId: assignment.paperId,
        title: assignment.title,
        availability: assignment.status === "ACTIVE" ? "AVAILABLE" : "UNAVAILABLE"
      }));

    if (items.length === 0) {
      return {
        outcome: "NO_ASSIGNMENTS",
        messageCode: REFEREE_ACCESS_OUTCOMES.NO_ASSIGNMENTS,
        items: []
      };
    }

    return {
      outcome: "ASSIGNMENTS_AVAILABLE",
      messageCode: REFEREE_ACCESS_OUTCOMES.ASSIGNMENTS_AVAILABLE,
      items
    };
  }
};

const accessAssignedPaperService = {
  async execute(input: {
    refereeUserId: string;
    assignmentId: string;
  }): Promise<Record<string, unknown>> {
    const assignment = demoState.assignments.get(input.assignmentId);

    if (!assignment || assignment.refereeId !== input.refereeUserId) {
      return {
        outcome: "UNAVAILABLE_OR_NOT_FOUND",
        messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE_OR_NOT_FOUND,
        message: "Assigned paper is unavailable for this referee."
      };
    }

    if (assignment.status !== "ACTIVE") {
      return {
        outcome: "UNAVAILABLE",
        messageCode: REFEREE_ACCESS_OUTCOMES.UNAVAILABLE,
        message: "Assigned paper is temporarily unavailable.",
        items: [
          {
            assignmentId: assignment.assignmentId,
            paperId: assignment.paperId,
            title: assignment.title,
            availability: "UNAVAILABLE"
          }
        ]
      };
    }

    return {
      outcome: "ACCESS_GRANTED",
      messageCode: REFEREE_ACCESS_OUTCOMES.ACCESS_GRANTED,
      paper: {
        paperId: assignment.paperId,
        title: assignment.title,
        contentUrl: "https://example.com/demo/papers/paper-301.pdf"
      },
      reviewForm: {
        reviewFormId: assignment.reviewFormId,
        schemaVersion: "v1",
        formUrl: "https://example.com/demo/forms/review-form-v1"
      }
    };
  }
};

const submitReviewService = {
  async getReviewForm(input: {
    refereeUserId: string;
    assignmentId: string;
  }): Promise<Record<string, unknown>> {
    const assignment = demoState.assignments.get(input.assignmentId);

    if (!assignment || assignment.refereeId !== input.refereeUserId) {
      return {
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
        message: "This review submission is unavailable.",
        reasonCode: REVIEW_SUBMISSION_REASON_CODES.NON_OWNED_OR_NON_ASSIGNED,
        statusCode: 404
      };
    }

    return {
      outcome: "REVIEW_FORM_AVAILABLE",
      messageCode: REVIEW_SUBMISSION_OUTCOMES.REVIEW_FORM_AVAILABLE,
      assignmentId: assignment.assignmentId,
      formVersion: "v1",
      fields: [
        { fieldId: "summary", required: true, constraints: ["min:20"] },
        { fieldId: "score", required: true },
        { fieldId: "confidence", required: true }
      ]
    };
  },
  async submitReview(input: {
    refereeUserId: string;
    assignmentId: string;
    payload: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const assignment = demoState.assignments.get(input.assignmentId);

    if (!assignment || assignment.refereeId !== input.refereeUserId) {
      return {
        outcome: "SUBMISSION_UNAVAILABLE",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.SUBMISSION_UNAVAILABLE,
        message: "This review submission is unavailable.",
        reasonCode: REVIEW_SUBMISSION_REASON_CODES.NON_OWNED_OR_NON_ASSIGNED,
        statusCode: 404
      };
    }

    if (!input.payload.responses || typeof input.payload.responses !== "object") {
      return {
        outcome: "VALIDATION_FAILED",
        messageCode: REVIEW_SUBMISSION_OUTCOMES.VALIDATION_FAILED,
        message: "Please correct the highlighted review form fields.",
        issues: [
          {
            fieldId: "responses",
            issue: "responses must be an object"
          }
        ]
      };
    }

    demoState.reviewCounter += 1;
    const reviewId = nextDeterministicUuid(demoState.reviewCounter);
    const submittedAt = new Date();
    const responses = input.payload.responses as Record<string, unknown>;

    const review: DemoReview = {
      assignmentId: assignment.assignmentId,
      reviewId,
      paperId: assignment.paperId,
      summary: typeof responses.summary === "string" ? responses.summary : "Review summary",
      scores: {
        score: responses.score ?? 4,
        confidence: responses.confidence ?? 3
      },
      recommendation:
        responses.recommendation === "REJECT"
          ? "REJECT"
          : responses.recommendation === "BORDERLINE"
            ? "BORDERLINE"
            : "ACCEPT",
      submittedAt
    };

    const current = demoState.reviewsByPaper.get(assignment.paperId) ?? [];
    const withoutCurrentAssignment = current.filter(
      (existing) => existing.assignmentId !== assignment.assignmentId
    );
    demoState.reviewsByPaper.set(assignment.paperId, [...withoutCurrentAssignment, review]);

    return {
      outcome: "REVIEW_SUBMISSION_ACCEPTED",
      messageCode: REVIEW_SUBMISSION_OUTCOMES.REVIEW_SUBMISSION_ACCEPTED,
      submissionId: reviewId,
      submittedAt: submittedAt.toISOString()
    };
  }
};

const completedReviewsService = {
  async execute(input: { paperId: string }): Promise<Record<string, unknown>> {
    const reviews = demoState.reviewsByPaper.get(input.paperId) ?? [];

    if (reviews.length === 0) {
      return {
        outcome: "REVIEWS_PENDING",
        messageCode: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_PENDING,
        message: "Required reviews are still pending.",
        completedReviewCount: 0,
        requiredReviewCount: 1
      };
    }

    return {
      outcome: "REVIEWS_VISIBLE",
      messageCode: REVIEW_VISIBILITY_OUTCOMES.REVIEWS_VISIBLE,
      paperId: input.paperId,
      completedReviewCount: reviews.length,
      requiredReviewCount: 1,
      reviews: reviews.map((review) => ({
        reviewId: review.reviewId,
        paperId: review.paperId,
        summary: review.summary,
        scores: review.scores,
        recommendation: review.recommendation,
        submittedAt: review.submittedAt
      }))
    };
  }
};

const postFinalDecisionService = {
  async execute(input: {
    paperId: string;
    decision: "ACCEPT" | "REJECT";
  }): Promise<Record<string, unknown>> {
    const reviews = demoState.reviewsByPaper.get(input.paperId) ?? [];
    if (reviews.length === 0) {
      return {
        outcome: "REVIEWS_PENDING",
        outcomeCode: FINAL_DECISION_OUTCOMES.REVIEWS_PENDING,
        message: "Required reviews are still pending.",
        completedReviewCount: 0,
        requiredReviewCount: 1
      };
    }

    const decidedAt = new Date().toISOString();
    const record: DemoDecision = {
      paperId: input.paperId,
      decision: input.decision,
      decidedAt,
      notificationStatus: "NOTIFIED"
    };
    demoState.decisionsByPaper.set(input.paperId, record);

    return {
      outcome: "DECISION_RECORDED",
      outcomeCode: FINAL_DECISION_OUTCOMES.DECISION_RECORDED,
      paperId: input.paperId,
      decision: input.decision,
      decidedAt,
      notificationStatus: "NOTIFIED",
      message: "Final decision has been recorded."
    };
  }
};

const getAuthorDecisionService = {
  async execute(input: {
    authorUserId: string;
    paperId: string;
  }): Promise<Record<string, unknown>> {
    const owner = demoState.paperOwners.get(input.paperId);
    if (owner !== input.authorUserId) {
      return {
        outcome: "UNAVAILABLE_DENIED",
        outcomeCode: AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
        statusCode: 404,
        message: "Decision is unavailable for this paper."
      };
    }

    const decision = demoState.decisionsByPaper.get(input.paperId);
    if (!decision) {
      return {
        outcome: "UNAVAILABLE_DENIED",
        outcomeCode: AUTHOR_DECISION_OUTCOMES.UNAVAILABLE_DENIED,
        statusCode: 404,
        message: "Decision is unavailable for this paper."
      };
    }

    return {
      outcome: "DECISION_AVAILABLE",
      outcomeCode: AUTHOR_DECISION_OUTCOMES.DECISION_AVAILABLE,
      paperId: input.paperId,
      decision: decision.decision
    };
  }
};

const generateConferenceScheduleService = {
  async execute(input: { conferenceId: string }): Promise<Record<string, unknown>> {
    if (input.conferenceId !== DEMO_IDS.conferenceId) {
      return {
        outcome: "UNAVAILABLE_DENIED",
        outcomeCode: CONFERENCE_SCHEDULE_OUTCOMES.UNAVAILABLE_DENIED,
        statusCode: 404,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    const acceptedPapers = Array.from(demoState.decisionsByPaper.values()).filter(
      (decision) => decision.decision === "ACCEPT"
    );

    if (acceptedPapers.length === 0) {
      return {
        outcome: "NO_ACCEPTED_PAPERS",
        outcomeCode: CONFERENCE_SCHEDULE_OUTCOMES.NO_ACCEPTED_PAPERS,
        message: "No accepted papers are available for schedule generation."
      };
    }

    const entries = acceptedPapers.map((decision, index) => ({
      paperId: decision.paperId,
      sessionCode: `S${index + 1}`,
      roomCode: `R${index + 1}`,
      startTime: new Date(Date.now() + index * 30 * 60000).toISOString(),
      endTime: new Date(Date.now() + (index * 30 + 20) * 60000).toISOString()
    }));

    demoState.schedule = {
      ...demoState.schedule,
      status: "FINAL",
      entries: acceptedPapers.map((decision, index) => ({
        paperId: decision.paperId,
        sessionId: index === 0 ? DEMO_IDS.sessionId : nextDeterministicUuid(710 + index),
        roomId: index === 0 ? DEMO_IDS.roomId : nextDeterministicUuid(730 + index),
        timeSlotId: index === 0 ? DEMO_IDS.timeSlotId : nextDeterministicUuid(750 + index)
      }))
    };

    return {
      outcome: "SCHEDULE_GENERATED",
      outcomeCode: CONFERENCE_SCHEDULE_OUTCOMES.SCHEDULE_GENERATED,
      conferenceId: input.conferenceId,
      entries
    };
  }
};

const scheduleEditService = {
  async getSchedule(input: { conferenceId: string }): Promise<Record<string, unknown>> {
    if (input.conferenceId !== DEMO_IDS.conferenceId) {
      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    return {
      outcome: "SCHEDULE_RETRIEVED",
      statusCode: 200,
      schedule: {
        id: demoState.schedule.id,
        conferenceId: demoState.schedule.conferenceId,
        status: demoState.schedule.status,
        entries: demoState.schedule.entries
      }
    };
  },
  async updateSchedule(input: { payload: unknown; conferenceId: string }): Promise<Record<string, unknown>> {
    if (input.conferenceId !== DEMO_IDS.conferenceId) {
      return {
        outcome: "UNAVAILABLE_DENIED",
        statusCode: 404,
        code: SCHEDULE_ERROR_CODES.UNAVAILABLE_DENIED,
        message: "Conference schedule is unavailable for this conference."
      };
    }

    const payload = input.payload as { scheduleId?: unknown; entries?: unknown };

    if (
      !payload ||
      !isUuid(payload.scheduleId) ||
      payload.scheduleId !== demoState.schedule.id ||
      !Array.isArray(payload.entries)
    ) {
      return {
        outcome: "INVALID_MODIFICATIONS",
        statusCode: 400,
        code: SCHEDULE_ERROR_CODES.INVALID_MODIFICATIONS,
        message: "Schedule modifications are invalid.",
        violations: [
          {
            field: "entries",
            message: "Valid scheduleId and entries are required.",
            value: "schema"
          }
        ]
      };
    }

    const normalizedEntries = payload.entries.map((entry, index) => {
      const candidate = entry as {
        paperId?: unknown;
        sessionId?: unknown;
        roomId?: unknown;
        timeSlotId?: unknown;
      };

      const fallback = demoState.schedule.entries[index] ?? demoState.schedule.entries[0];

      return {
        paperId: isUuid(candidate.paperId) ? candidate.paperId : fallback.paperId,
        sessionId: isUuid(candidate.sessionId) ? candidate.sessionId : fallback.sessionId,
        roomId: isUuid(candidate.roomId) ? candidate.roomId : fallback.roomId,
        timeSlotId: isUuid(candidate.timeSlotId) ? candidate.timeSlotId : fallback.timeSlotId
      };
    });

    demoState.schedule = {
      ...demoState.schedule,
      status: "FINAL",
      entries: normalizedEntries
    };

    return {
      outcome: "SCHEDULE_UPDATED",
      statusCode: 200,
      schedule: {
        ...demoState.schedule,
        status: "FINAL"
      },
      message: "Conference schedule updated and finalized."
    };
  }
};

const authorScheduleService = {
  async getAuthorSchedule(input: { authorUserId: string }): Promise<Record<string, unknown>> {
    if (!demoState.authorSchedulePublished) {
      return {
        outcome: "SCHEDULE_NOT_PUBLISHED",
        statusCode: 404,
        code: SCHEDULE_ACCESS_ERROR_CODES.SCHEDULE_NOT_PUBLISHED,
        message: "Schedule is not published yet."
      };
    }

    const authorPaperIds = Array.from(demoState.paperOwners.entries())
      .filter(([, ownerId]) => ownerId === input.authorUserId)
      .map(([paperId]) => paperId);

    return {
      outcome: "SCHEDULE_AVAILABLE",
      statusCode: 200,
      schedule: {
        id: demoState.schedule.id,
        conferenceId: demoState.schedule.conferenceId,
        status: demoState.schedule.status,
        entries: demoState.schedule.entries,
        authorPresentations: demoState.schedule.entries
          .filter((entry) => authorPaperIds.includes(entry.paperId))
          .map((entry) => ({
            paperId: entry.paperId,
            roomId: entry.roomId,
            timeSlotId: entry.timeSlotId
          }))
      }
    };
  }
};

const app = buildServer({
  service: announcementService,
  requireTls: false
});

app.addHook("onSend", async (request, reply, payload) => {
  if (request.routeOptions.url !== "/api/public/login" || reply.statusCode !== 200) {
    return payload;
  }

  const session = loginRepository.getSessionForRequestId(request.id);
  if (!session) {
    return payload;
  }

  reply.header("set-cookie", [
    `cms_session=${session.sessionId}; Path=/; SameSite=Lax`,
    `session=${session.sessionId}; Path=/; SameSite=Lax`
  ]);

  return payload;
});

const sessionAuthMiddleware = createSessionAuthMiddleware({
  sessionRepository: sessionStore
});
const authorSessionAuth = createAuthorSessionAuth({
  sessionRepository: sessionStore
});
const editorAssignmentGuard = createEditorAssignmentGuard({
  sessionRepository: sessionStore
});
const reviewInvitationAuthorization = createReviewInvitationAuthorization({
  sessionRepository: sessionStore
});
const refereeSessionGuard = createRefereeSessionGuard({
  sessionRepository: sessionStore
});
const reviewSubmissionSessionGuard = createReviewSubmissionSessionGuard({
  sessionRepository: sessionStore
});
const reviewVisibilitySessionGuard = createReviewVisibilitySessionGuard({
  sessionRepository: sessionStore
});
const finalDecisionSessionGuard = createFinalDecisionSessionGuard({
  sessionRepository: sessionStore
});
const authorDecisionSessionGuard = createAuthorDecisionSessionGuard({
  sessionRepository: sessionStore
});
const conferenceScheduleSessionGuard = createConferenceScheduleSessionGuard({
  sessionRepository: sessionStore
});
const editorScheduleSessionGuard = createEditorScheduleSessionGuard({
  sessionRepository: sessionStore
});
const authorScheduleSessionGuard = createAuthorScheduleSessionGuard({
  sessionRepository: sessionStore
});

app.register(
  createPublicRoutes({
    registrationPriceService
  })
);
app.register(createPublicRegistrationRoute({ registerUser }));
app.register(
  createLoginRoutes({
    successUseCase: loginSuccessUseCase,
    failureUseCase: loginFailureUseCase,
    observability: loginObservability,
    repository: loginRepository
  })
);
app.register(
  createPasswordChangeRoute({
    changePasswordService: changePasswordService as any,
    sessionAuthMiddleware
  })
);
app.register(
  createManuscriptSubmissionsRoute({
    submitManuscriptService: manuscriptSubmissionService as any,
    authorSessionAuth
  })
);
app.register(
  createSubmissionDraftRoutes({
    saveUseCase: draftSaveUseCase as any,
    getUseCase: draftGetUseCase as any,
    authorSessionAuth
  })
);
app.register(
  createRefereeAssignmentRoutes({
    getOptionsUseCase: refereeOptionsUseCase as any,
    assignRefereesUseCase: assignRefereesUseCase as any,
    editorAssignmentGuard
  })
);
app.register(
  createReviewInvitationRoutes({
    getReviewInvitationUseCase: getReviewInvitationUseCase as any,
    respondToReviewInvitationUseCase: respondToReviewInvitationUseCase as any,
    reviewInvitationAuthorization
  })
);
app.register(
  createRefereeAccessRoutes({
    listAssignmentsService: listAssignmentsService as any,
    accessAssignedPaperService: accessAssignedPaperService as any,
    refereeSessionGuard
  })
);
app.register(
  createReviewSubmissionRoutes({
    service: submitReviewService as any,
    reviewSubmissionSessionGuard
  })
);
app.register(
  createReviewVisibilityRoutes({
    service: completedReviewsService as any,
    reviewVisibilitySessionGuard
  })
);
app.register(
  createFinalDecisionRoutes({
    service: postFinalDecisionService as any,
    finalDecisionSessionGuard
  })
);
app.register(
  createAuthorDecisionRoutes({
    service: getAuthorDecisionService as any,
    authorDecisionSessionGuard
  })
);
app.register(
  createConferenceScheduleRoutes({
    service: generateConferenceScheduleService as any,
    conferenceScheduleSessionGuard
  })
);
app.register(
  createEditorRoutes({
    scheduleService: scheduleEditService as any,
    conferenceScheduleSessionGuard: editorScheduleSessionGuard as any
  })
);
app.register(
  createAuthorRoutes({
    authorScheduleService: authorScheduleService as any,
    authorScheduleSessionGuard
  })
);

app.get("/api/demo/credentials", async () => ({
  defaultPassword: DEMO_PASSWORD,
  roles: DEMO_USERS.map((user) => ({
    role: user.role,
    username: user.username,
    accountId: user.id,
    sessionId: sessionStore.getSeedSessionByAccount(user.id)?.sessionId ?? null
  }))
}));

app.get("/health", async () => ({ status: "ok" }));

const defaultPasswordHash = await argon2.hash(DEMO_PASSWORD, {
  type: argon2.argon2id
});

for (const user of DEMO_USERS) {
  await loginRepository.seedAccount({
    id: user.id,
    username: user.username,
    passwordHash: defaultPasswordHash,
    role: user.role
  });

  const seededSessionId = `00000000-0000-4000-8000-${String(100 + DEMO_USERS.indexOf(user)).padStart(12, "0")}`;

  await sessionStore.seed({
    sessionId: seededSessionId,
    accountId: user.id,
    role: user.role,
    status: "ACTIVE",
    issuedAt: new Date()
  });
}

const host = process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

try {
  await app.listen({ host, port });
  // eslint-disable-next-line no-console
  console.log(`Backend dev server running at http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log("Demo logins (all roles):");
  for (const user of DEMO_USERS) {
    // eslint-disable-next-line no-console
    console.log(`- ${user.role}: username=${user.username} password=${DEMO_PASSWORD}`);
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Failed to start backend dev server", error);
  process.exit(1);
}
