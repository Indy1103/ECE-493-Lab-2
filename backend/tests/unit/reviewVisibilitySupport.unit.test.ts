import assert from "node:assert/strict";
import test from "node:test";

import { ReviewVisibilityAnonymizer } from "../../src/business/review-visibility/anonymizer.js";
import {
  REVIEW_VISIBILITY_AUDIT_LOGGER_MARKER,
  ReviewVisibilityAuditLogger
} from "../../src/business/review-visibility/audit-logger.js";
import { ReviewCompletionGate } from "../../src/business/review-visibility/completion-gate.js";
import { GetCompletedReviewsService } from "../../src/business/review-visibility/get-completed-reviews.service.js";
import {
  REVIEW_VISIBILITY_PORTS_MARKER,
  type CompletedReviewRecord,
  type ReviewVisibilityAuditEvent
} from "../../src/business/review-visibility/ports.js";
import {
  REVIEW_VISIBILITY_OUTCOMES,
  REVIEW_VISIBILITY_REASON_CODES
} from "../../src/business/review-visibility/visibility-outcome.js";
import {
  PrismaReviewVisibilityRepository,
  REVIEW_VISIBILITY_AUDIT_REPOSITORY_MARKER,
  REVIEW_VISIBILITY_PRISMA_REPOSITORY_MARKER,
  ReviewVisibilityAuditRepository,
  ReviewVisibilityConflictError,
  ReviewVisibilityReadFailureError
} from "../../src/data/review-visibility/review-visibility.repository.js";
import {
  CompletedReviewsResponseSchema,
  PendingReviewsResponseSchema,
  ReviewVisibilityErrorResponseSchema,
  buildReviewVisibilitySessionExpiredResponse,
  mapReviewVisibilityOutcome
} from "../../src/presentation/review-visibility/error-mapper.js";
import { createGetCompletedReviewsHandler } from "../../src/presentation/review-visibility/get-completed-reviews.handler.js";
import {
  createReviewVisibilityRoutes,
  requireReviewVisibilityTransportSecurity
} from "../../src/presentation/review-visibility/routes.js";
import {
  createReviewSubmissionSessionGuard,
  createReviewVisibilitySessionGuard,
  type ReviewSubmissionSessionRepository,
  type ReviewVisibilitySessionRepository
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

function buildReview(index: number, paperId: string): CompletedReviewRecord {
  return {
    reviewId: `r-${index}`,
    paperId,
    refereeUserId: `ref-${index}`,
    summary: `summary ${index}`,
    scores: { overall: index },
    recommendation: index % 2 === 0 ? "ACCEPT" : "REJECT",
    submittedAt: new Date("2026-03-01T00:00:00.000Z")
  };
}

test("completion gate branches for pending and complete states", () => {
  const gate = new ReviewCompletionGate();

  const pendingByStatus = gate.evaluate({
    paperId: "p1",
    completedReviewCount: 1,
    requiredReviewCount: 2,
    status: "PENDING",
    checkedAt: new Date()
  });
  assert.equal(pendingByStatus.allowed, false);

  const pendingByCount = gate.evaluate({
    paperId: "p1",
    completedReviewCount: 1,
    requiredReviewCount: 2,
    status: "COMPLETE",
    checkedAt: new Date()
  });
  assert.equal(pendingByCount.allowed, false);

  const complete = gate.evaluate({
    paperId: "p1",
    completedReviewCount: 2,
    requiredReviewCount: 2,
    status: "COMPLETE",
    checkedAt: new Date()
  });
  assert.equal(complete.allowed, true);
});

test("anonymizer strips referee identity and clones nested values", () => {
  const anonymizer = new ReviewVisibilityAnonymizer();
  const review = buildReview(1, "p1");

  const one = anonymizer.anonymizeReview(review);
  const many = anonymizer.anonymizeReviews([review]);

  assert.equal("refereeUserId" in one, false);
  assert.equal(many.length, 1);

  (review.scores as { overall: number }).overall = 99;
  assert.equal((one.scores as { overall: number }).overall, 1);
});

test("repository lock, read, and failure branches", async () => {
  const repository = new PrismaReviewVisibilityRepository();

  repository.seedPaper({
    paperId: "p1",
    assignedEditorIds: ["e1"],
    requiredReviewCount: 2
  });
  repository.seedReview(buildReview(1, "p1"));
  repository.seedReview(buildReview(2, "p1"));

  const complete = await repository.getCompletionStatus("p1", "e1");
  assert.equal(complete?.status, "COMPLETE");

  const denied = await repository.getCompletionStatus("p1", "e2");
  assert.equal(denied, null);

  const reviews = await repository.getCompletedReviews("p1", "e1");
  assert.equal(reviews.length, 2);

  const deniedReviews = await repository.getCompletedReviews("p1", "e2");
  assert.equal(deniedReviews.length, 0);

  repository.setForceNextReadFailure(true);
  await assert.rejects(() => repository.getCompletionStatus("p1", "e1"), {
    name: "ReviewVisibilityReadFailureError"
  });

  repository.setForceLockConflict(true);
  await assert.rejects(() => repository.withPaperReadLock("p1", async () => "ok"), {
    name: "ReviewVisibilityConflictError"
  });

  assert.equal(repository.isEncryptedAtRest(), true);

  const conflict = new ReviewVisibilityConflictError();
  const readFailure = new ReviewVisibilityReadFailureError();
  assert.equal(conflict.name, "ReviewVisibilityConflictError");
  assert.equal(readFailure.name, "ReviewVisibilityReadFailureError");
});

test("audit logger and repository sanitize sensitive metadata", async () => {
  const captured: ReviewVisibilityAuditEvent[] = [];
  const repository = new ReviewVisibilityAuditRepository({
    emit: (event) => {
      captured.push(event);
    }
  });
  const logger = new ReviewVisibilityAuditLogger({ repository });

  await logger.record({
    actorUserId: "editor-1",
    paperId: "paper-1",
    outcome: "REVIEWS_VISIBLE",
    reasonCode: "ok",
    metadata: {
      reviews: [{ refereeUserId: "secret" }],
      refereeUserId: "secret",
      keep: true
    }
  });

  const events = repository.list();
  assert.equal(events.length, 1);
  assert.equal(events[0]?.metadata.reviews, "[REDACTED]");
  assert.equal(events[0]?.metadata.refereeUserId, "[REDACTED]");
  assert.equal(events[0]?.metadata.keep, true);
  assert.equal(captured.length, 1);
  assert.equal(repository.isEncryptedAtRest(), true);

  await logger.record({
    actorUserId: "editor-1",
    paperId: "paper-1",
    outcome: "REVIEWS_PENDING",
    reasonCode: "pending"
  });

  const second = repository.list()[1];
  assert.deepEqual(second?.metadata, {});
});

test("service outcomes cover unavailable, pending, visible, and read-failure fallback", async () => {
  const repository = new PrismaReviewVisibilityRepository();
  repository.seedPaper({
    paperId: "paper-visible",
    assignedEditorIds: ["editor-1"],
    requiredReviewCount: 1
  });
  repository.seedReview(buildReview(1, "paper-visible"));

  repository.seedPaper({
    paperId: "paper-pending",
    assignedEditorIds: ["editor-1"],
    requiredReviewCount: 2
  });
  repository.seedReview(buildReview(2, "paper-pending"));

  const auditRepository = new ReviewVisibilityAuditRepository();
  const service = new GetCompletedReviewsService({
    repository,
    completionGate: new ReviewCompletionGate(),
    anonymizer: new ReviewVisibilityAnonymizer(),
    auditLogger: new ReviewVisibilityAuditLogger({ repository: auditRepository })
  });

  const unavailable = await service.execute({
    editorUserId: "editor-1",
    paperId: "paper-missing",
    requestId: "req-a"
  });
  assert.equal(unavailable.outcome, "UNAVAILABLE_DENIED");

  const pending = await service.execute({
    editorUserId: "editor-1",
    paperId: "paper-pending",
    requestId: "req-b"
  });
  assert.equal(pending.outcome, "REVIEWS_PENDING");

  const visible = await service.execute({
    editorUserId: "editor-1",
    paperId: "paper-visible",
    requestId: "req-c"
  });
  assert.equal(visible.outcome, "REVIEWS_VISIBLE");
  if (visible.outcome === "REVIEWS_VISIBLE") {
    assert.equal(visible.reviews.length, 1);
    assert.equal("refereeUserId" in visible.reviews[0], false);
  }

  repository.setForceNextReadFailure(true);
  const unavailableOnReadFailure = await service.execute({
    editorUserId: "editor-1",
    paperId: "paper-visible",
    requestId: "req-d"
  });
  assert.equal(unavailableOnReadFailure.outcome, "UNAVAILABLE_DENIED");

  const outcomes = auditRepository.list().map((event) => event.outcome);
  assert.equal(outcomes.includes("UNAVAILABLE_DENIED"), true);
  assert.equal(outcomes.includes("REVIEWS_PENDING"), true);
  assert.equal(outcomes.includes("REVIEWS_VISIBLE"), true);
});

test("service handles completed-review query failure by returning visible with empty reviews", async () => {
  const auditRepository = new ReviewVisibilityAuditRepository();
  const service = new GetCompletedReviewsService({
    repository: {
      async withPaperReadLock(_paperId, operation) {
        return operation();
      },
      async getCompletionStatus() {
        return {
          paperId: "paper-1",
          completedReviewCount: 2,
          requiredReviewCount: 2,
          status: "COMPLETE" as const,
          checkedAt: new Date()
        };
      },
      async getCompletedReviews() {
        throw new Error("read failed");
      }
    },
    completionGate: new ReviewCompletionGate(),
    anonymizer: new ReviewVisibilityAnonymizer(),
    auditLogger: new ReviewVisibilityAuditLogger({ repository: auditRepository })
  });

  const outcome = await service.execute({
    editorUserId: "editor-1",
    paperId: "paper-1",
    requestId: "req-read-failure"
  });

  assert.equal(outcome.outcome, "REVIEWS_VISIBLE");
  if (outcome.outcome === "REVIEWS_VISIBLE") {
    assert.equal(outcome.reviews.length, 0);
  }
});

test("error mapper and handler branches are covered", async () => {
  const expired = buildReviewVisibilitySessionExpiredResponse();
  assert.equal(expired.statusCode, 401);

  const mappedVisible = mapReviewVisibilityOutcome({
    outcome: "REVIEWS_VISIBLE",
    messageCode: "REVIEWS_VISIBLE",
    paperId: "p1",
    completedReviewCount: 1,
    requiredReviewCount: 1,
    reviews: [
      {
        reviewId: "r1",
        paperId: "p1",
        summary: "s",
        scores: { overall: 4 },
        recommendation: "ACCEPT",
        submittedAt: new Date("2026-03-01T00:00:00.000Z")
      }
    ]
  });
  assert.equal(mappedVisible.statusCode, 200);
  assert.equal(CompletedReviewsResponseSchema.safeParse(mappedVisible.body).success, true);

  const mappedPending = mapReviewVisibilityOutcome({
    outcome: "REVIEWS_PENDING",
    messageCode: "REVIEWS_PENDING",
    message: "pending",
    completedReviewCount: 1,
    requiredReviewCount: 2
  });
  assert.equal(mappedPending.statusCode, 409);
  assert.equal(PendingReviewsResponseSchema.safeParse(mappedPending.body).success, true);

  const mappedDenied = mapReviewVisibilityOutcome({
    outcome: "UNAVAILABLE_DENIED",
    messageCode: "UNAVAILABLE_DENIED",
    message: "denied",
    statusCode: 404
  });
  assert.equal(mappedDenied.statusCode, 404);
  assert.equal(ReviewVisibilityErrorResponseSchema.safeParse(mappedDenied.body).success, true);

  const mappedDefault = mapReviewVisibilityOutcome({ outcome: "UNKNOWN" } as never);
  assert.equal(mappedDefault.statusCode, 404);

  const noSessionReply = createReplyDouble();
  const handler = createGetCompletedReviewsHandler({
    service: {
      execute: async () => ({
        outcome: "REVIEWS_VISIBLE",
        messageCode: "REVIEWS_VISIBLE",
        paperId: "p1",
        completedReviewCount: 1,
        requiredReviewCount: 1,
        reviews: []
      })
    }
  });

  await handler(
    {
      id: "req-1",
      params: { paperId: "p1" }
    } as never,
    noSessionReply as never
  );
  assert.equal(noSessionReply.statusCode, 401);

  const nonEditorReply = createReplyDouble();
  await handler(
    {
      id: "req-2",
      params: { paperId: "p1" },
      reviewVisibilitySession: {
        userId: "u1",
        sessionId: "s1",
        role: "AUTHOR"
      }
    } as never,
    nonEditorReply as never
  );
  assert.equal(nonEditorReply.statusCode, 403);

  const editorReply = createReplyDouble();
  await handler(
    {
      id: "req-3",
      params: { paperId: "p1" },
      reviewVisibilitySession: {
        userId: "u1",
        sessionId: "s1",
        role: "EDITOR"
      }
    } as never,
    editorReply as never
  );
  assert.equal(editorReply.statusCode, 200);
});

test("route security and session guards cover all branches", async () => {
  const tlsReply = createReplyDouble();
  await requireReviewVisibilityTransportSecurity(
    { headers: { "x-forwarded-proto": "http" } } as never,
    tlsReply as never
  );
  assert.equal(tlsReply.statusCode, 426);

  const tlsPassReply = createReplyDouble();
  await requireReviewVisibilityTransportSecurity(
    { headers: { "x-forwarded-proto": "https" } } as never,
    tlsPassReply as never
  );
  assert.equal(tlsPassReply.statusCode, 200);

  const reviewSubmissionSessionRepository: ReviewSubmissionSessionRepository = {
    async getSessionById() {
      return {
        sessionId: "s1",
        accountId: "u1",
        role: "REFEREE",
        status: "ACTIVE"
      };
    }
  };

  const submissionGuard = createReviewSubmissionSessionGuard({
    sessionRepository: reviewSubmissionSessionRepository
  });

  const submissionReply = createReplyDouble();
  const submissionRequest = { headers: { cookie: "session=s1" } } as never;
  await submissionGuard(submissionRequest, submissionReply as never);
  assert.equal(submissionReply.statusCode, 200);

  const visibilityRepository: ReviewVisibilitySessionRepository = {
    async getSessionById(sessionId) {
      if (sessionId === "active") {
        return {
          sessionId,
          accountId: "editor-1",
          role: "EDITOR",
          status: "ACTIVE"
        };
      }

      return {
        sessionId,
        accountId: "editor-1",
        role: "EDITOR",
        status: "REVOKED"
      };
    }
  };

  const visibilityGuard = createReviewVisibilitySessionGuard({ sessionRepository: visibilityRepository });

  const missingReply = createReplyDouble();
  await visibilityGuard({ headers: {} } as never, missingReply as never);
  assert.equal(missingReply.statusCode, 401);

  const revokedReply = createReplyDouble();
  await visibilityGuard({ headers: { cookie: "session=revoked" } } as never, revokedReply as never);
  assert.equal(revokedReply.statusCode, 401);

  const activeReply = createReplyDouble();
  const activeRequest = { headers: { cookie: "cms_session=active" } } as unknown as any;
  await visibilityGuard(activeRequest, activeReply as never);
  assert.equal(activeReply.statusCode, 200);
  assert.equal(activeRequest.reviewVisibilitySession?.role, "EDITOR");

  const registered = createReviewVisibilityRoutes({
    service: {
      execute: async () => ({
        outcome: "UNAVAILABLE_DENIED",
        messageCode: "UNAVAILABLE_DENIED",
        message: "denied",
        statusCode: 404
      })
    },
    reviewVisibilitySessionGuard: async () => {
      // no-op
    }
  });
  assert.equal(typeof registered, "function");
});

test("markers and constants remain available for static coverage", () => {
  assert.equal(REVIEW_VISIBILITY_PORTS_MARKER, "review_visibility_ports_marker");
  assert.equal(
    REVIEW_VISIBILITY_PRISMA_REPOSITORY_MARKER,
    "review_visibility_prisma_repository_marker"
  );
  assert.equal(
    REVIEW_VISIBILITY_AUDIT_REPOSITORY_MARKER,
    "review_visibility_audit_repository_marker"
  );
  assert.equal(REVIEW_VISIBILITY_AUDIT_LOGGER_MARKER, "review_visibility_audit_logger_marker");
  assert.equal(REVIEW_VISIBILITY_OUTCOMES.REVIEWS_VISIBLE, "REVIEWS_VISIBLE");
  assert.equal(
    REVIEW_VISIBILITY_REASON_CODES.PAPER_NOT_FOUND_OR_DENIED,
    "paper-not-found-or-denied"
  );
});

test("repository returns pending and empty completed-review arrays when no reviews exist", async () => {
  const repository = new PrismaReviewVisibilityRepository();

  repository.seedPaper({
    paperId: "paper-empty",
    assignedEditorIds: ["editor-1"],
    requiredReviewCount: 1
  });

  const completion = await repository.getCompletionStatus("paper-empty", "editor-1");
  assert.equal(completion?.status, "PENDING");

  const completedReviews = await repository.getCompletedReviews("paper-empty", "editor-1");
  assert.equal(Array.isArray(completedReviews), true);
  assert.equal(completedReviews.length, 0);
});
