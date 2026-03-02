import assert from "node:assert/strict";
import test from "node:test";

import Fastify from "fastify";
import { Registry } from "prom-client";
import request from "supertest";

import {
  createAuthorSessionAuth
} from "../../src/presentation/middleware/author-session-auth.js";
import { requireTransportSecurity } from "../../src/presentation/middleware/transport-security.js";
import { normalizeManuscriptTitle } from "../../src/business/manuscripts/title-normalization.service.js";
import {
  mapMetadataValidationViolations,
  parseSubmissionBody
} from "../../src/business/manuscripts/submission-metadata-validation.service.js";
import { SubmissionMetadataPolicyService } from "../../src/business/manuscripts/submission-metadata-policy.service.js";
import {
  InMemoryManuscriptStorageAdapter
} from "../../src/data/manuscripts/manuscript-storage.adapter.js";
import {
  InMemoryManuscriptArtifactRepository
} from "../../src/data/manuscripts/manuscript-artifact.repository.js";
import {
  InMemoryManuscriptSubmissionRepository
} from "../../src/data/manuscripts/manuscript-submission.repository.js";
import {
  InMemorySubmissionAttemptAuditRepository
} from "../../src/data/manuscripts/submission-attempt-audit.repository.js";
import { SubmissionDeduplicationService } from "../../src/business/manuscripts/submission-deduplication.service.js";
import { SubmissionHandoffService } from "../../src/business/manuscripts/submission-handoff.service.js";
import { ManuscriptFileValidationService } from "../../src/business/manuscripts/manuscript-file-validation.service.js";
import {
  createManuscriptSubmissionMetrics
} from "../../src/business/observability/manuscript-submission-metrics.js";
import {
  ManuscriptSubmissionObservabilityService
} from "../../src/business/observability/manuscript-submission-observability.service.js";
import {
  InMemoryConferenceCycleRepository
} from "../../src/data/manuscripts/conference-cycle.repository.js";
import { SubmitManuscriptService } from "../../src/business/manuscripts/submit-manuscript.service.js";
import { createManuscriptSubmissionsRoute } from "../../src/presentation/manuscripts/manuscript-submissions.controller.js";
import {
  ManuscriptAuthorizationError,
  ManuscriptDuplicateError,
  ManuscriptIntakeClosedError,
  ManuscriptOperationalError,
  ManuscriptValidationError
} from "../../src/shared/errors/manuscript-submission-errors.js";
import { redactManuscriptSubmissionLog } from "../../src/shared/logging/redaction.js";

test("title normalization applies FR-016 order", () => {
  const normalized = normalizeManuscriptTitle("  Café — Systems!!!  ");
  assert.equal(normalized, "café systems");
});

test("metadata parsing and validation maps violations and strictness", () => {
  const parsed = parseSubmissionBody({
    metadata: {
      title: "A",
      abstract: "B",
      keywords: ["k1"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE"
    },
    manuscriptFile: {
      filename: "a.pdf",
      mediaType: "application/pdf",
      byteSize: 10,
      sha256Digest: "a".repeat(64),
      contentBase64: "JVBERi0xLjQ="
    }
  });

  assert.equal(parsed.violations.length, 0);

  const malformed = parseSubmissionBody({
    metadata: {},
    manuscriptFile: {}
  });
  assert.equal(malformed.violations.length > 0, true);
  assert.equal(parseSubmissionBody(undefined).violations.length > 0, true);

  const violationSet = mapMetadataValidationViolations({
    metadata: {
      title: "",
      abstract: "",
      keywords: [],
      fullAuthorList: [],
      correspondingAuthorEmail: "invalid",
      primarySubjectArea: ""
    },
    requiredFields: ["title", "title", "abstract", "keywords", "fullAuthorList", "primarySubjectArea"]
  });
  assert.equal(violationSet.length > 0, true);

  const rootPathFallback = mapMetadataValidationViolations({
    metadata: {
      title: "A",
      abstract: "B",
      keywords: ["k"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE",
      extraField: "not-allowed"
    } as unknown as Parameters<typeof mapMetadataValidationViolations>[0]["metadata"],
    requiredFields: []
  });
  assert.equal(rootPathFallback.some((violation) => violation.field === "metadata"), true);

  const requestRootPathFallback = parseSubmissionBody({
    metadata: {
      title: "A",
      abstract: "B",
      keywords: ["k"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE"
    },
    manuscriptFile: {
      filename: "a.pdf",
      mediaType: "application/pdf",
      byteSize: 1,
      sha256Digest: "a".repeat(64)
    },
    unexpectedTopLevel: true
  });
  assert.equal(
    requestRootPathFallback.violations.some((violation) => violation.field === "request"),
    true
  );
});

test("metadata policy exposes expected required fields and file constraints", () => {
  const service = new SubmissionMetadataPolicyService();
  const cycle = {
    id: "cycle-1",
    intakeStatus: "OPEN" as const,
    metadataPolicyVersion: "CMS Manuscript Submission Policy v1.0",
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    endsAt: new Date("2026-12-31T00:00:00.000Z")
  };

  const requirements = service.buildRequirements(cycle);
  assert.equal(requirements.cycleId, "cycle-1");
  assert.equal(requirements.requiredMetadataFields.includes("title"), true);
  assert.equal(requirements.fileConstraints.maxBytes, 20 * 1024 * 1024);
});

test("storage adapter supports success and force-failure", async () => {
  const adapter = new InMemoryManuscriptStorageAdapter();
  const stored = await adapter.store({
    authorId: "a1",
    requestId: "r1",
    filename: "paper.pdf",
    mediaType: "application/pdf",
    byteSize: 100,
    sha256Digest: "a".repeat(64)
  });
  assert.equal(stored.storageObjectKey.startsWith("encrypted://"), true);

  const failing = new InMemoryManuscriptStorageAdapter({ forceFailure: true });
  await assert.rejects(
    failing.store({
      authorId: "a1",
      requestId: "r1",
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 100,
      sha256Digest: "a".repeat(64)
    })
  );
});

test("artifact repository lifecycle and snapshot restore", async () => {
  const repository = new InMemoryManuscriptArtifactRepository();
  const artifact = await repository.createArtifact({
    storageObjectKey: "encrypted://a/b/paper.pdf",
    mediaType: "application/pdf",
    byteSize: 100,
    sha256Digest: "b".repeat(64)
  });
  assert.equal(repository.getAll().length, 1);

  const snapshot = repository.snapshot();
  await repository.removeArtifact(artifact.id);
  assert.equal(repository.getAll().length, 0);

  repository.restore(snapshot);
  assert.equal(repository.getAll().length, 1);
});

test("submission repository enforces active duplicate and supports metadata read/restore", async () => {
  const repository = new InMemoryManuscriptSubmissionRepository();
  const now = new Date("2026-02-10T00:00:00.000Z");

  const created = await repository.createAcceptedSubmission({
    authorId: "a1",
    conferenceCycleId: "c1",
    normalizedTitle: "paper title",
    metadataPolicyVersion: "v1",
    manuscriptArtifactId: "artifact-1",
    metadata: {
      title: "Paper Title",
      abstract: "Abstract",
      keywords: ["k"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE"
    },
    now
  });

  assert.equal(created.duplicate, false);
  assert.equal(repository.getMetadataBySubmissionId(created.submission!.id)?.title, "Paper Title");
  assert.equal(repository.getMetadataBySubmissionId("missing"), null);

  const duplicate = await repository.createAcceptedSubmission({
    authorId: "a1",
    conferenceCycleId: "c1",
    normalizedTitle: "paper title",
    metadataPolicyVersion: "v1",
    manuscriptArtifactId: "artifact-2",
    metadata: {
      title: "Paper Title",
      abstract: "Abstract",
      keywords: ["k"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE"
    },
    now
  });
  assert.equal(duplicate.duplicate, true);

  await repository.markDownstreamAvailable(created.submission!.id);
  await repository.markDownstreamAvailable("missing");
  assert.equal(repository.getAll()[0]?.downstreamAvailable, true);

  const snapshot = repository.snapshot();
  repository.restore({ submissions: [], metadata: [] });
  assert.equal(repository.getAll().length, 0);
  repository.restore(snapshot);
  assert.equal(repository.getAll().length, 1);
});

test("audit repository supports record, snapshot, and restore", async () => {
  const repository = new InMemorySubmissionAttemptAuditRepository();

  await repository.record({
    authorId: "a1",
    submissionId: null,
    requestId: "r1",
    outcome: "SUCCESS",
    reasonCode: "SUBMISSION_ACCEPTED"
  });
  assert.equal(repository.getAll().length, 1);

  const snapshot = repository.snapshot();
  await repository.record({
    authorId: "a1",
    submissionId: null,
    requestId: "r2",
    outcome: "OPERATIONAL_FAILED",
    reasonCode: "OPERATIONAL_FAILURE"
  });
  repository.restore(snapshot);
  assert.equal(repository.getAll().length, 1);
});

test("deduplication, handoff, file validation, and observability branches execute", async () => {
  const submissionRepository = new InMemoryManuscriptSubmissionRepository();
  const deduplicationService = new SubmissionDeduplicationService({ submissionRepository });

  const created = await deduplicationService.createSingleWinner({
    authorId: "a1",
    conferenceCycleId: "c1",
    normalizedTitle: "title",
    metadataPolicyVersion: "v1",
    manuscriptArtifactId: "artifact-1",
    metadata: {
      title: "Title",
      abstract: "Abstract",
      keywords: ["k"],
      fullAuthorList: [{ name: "A" }],
      correspondingAuthorEmail: "a@example.com",
      primarySubjectArea: "SE"
    },
    now: new Date()
  });
  assert.equal(created.duplicate, false);

  const handoffService = new SubmissionHandoffService({
    async markDownstreamAvailable(submissionId: string) {
      await submissionRepository.markDownstreamAvailable(submissionId);
    }
  });
  await handoffService.handoff(created.submission!.id);
  assert.equal(submissionRepository.getAll()[0]?.downstreamAvailable, true);

  const failingHandoff = new SubmissionHandoffService(
    { async markDownstreamAvailable() {} },
    { forceFailure: true }
  );
  await assert.rejects(failingHandoff.handoff("s1"));

  const fileService = new ManuscriptFileValidationService({
    storageAdapter: new InMemoryManuscriptStorageAdapter()
  });
  const invalidType = await fileService.validateAndStore({
    authorId: "a1",
    requestId: "r1",
    manuscriptFile: {
      filename: "paper.txt",
      mediaType: "text/plain",
      byteSize: 10,
      sha256Digest: "a".repeat(64)
    }
  });
  assert.equal(invalidType.valid, false);

  const invalidSize = await fileService.validateAndStore({
    authorId: "a1",
    requestId: "r1",
    manuscriptFile: {
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 20 * 1024 * 1024 + 5,
      sha256Digest: "a".repeat(64)
    }
  });
  assert.equal(invalidSize.valid, false);

  const invalidDigest = await fileService.validateAndStore({
    authorId: "a1",
    requestId: "r1",
    manuscriptFile: {
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 100,
      sha256Digest: "short"
    }
  });
  assert.equal(invalidDigest.valid, false);

  const valid = await fileService.validateAndStore({
    authorId: "a1",
    requestId: "r1",
    manuscriptFile: {
      filename: "paper.pdf",
      mediaType: "application/pdf",
      byteSize: 100,
      sha256Digest: "a".repeat(64)
    }
  });
  assert.equal(valid.valid, true);

  let duplicateMetricCount = 0;
  let outcomeCount = 0;
  let latencyObserved = 0;
  const observability = new ManuscriptSubmissionObservabilityService({
    auditRepository: new InMemorySubmissionAttemptAuditRepository(),
    metrics: {
      incrementDuplicateConflict() {
        duplicateMetricCount += 1;
      },
      incrementOutcome() {
        outcomeCount += 1;
      },
      observeLatencyMs(durationMs: number) {
        latencyObserved = durationMs;
      }
    }
  });
  await observability.recordAttempt({
    authorId: "a1",
    submissionId: null,
    requestId: "r1",
    outcome: "DUPLICATE_REJECTED",
    reasonCode: "DUPLICATE_ACTIVE_SUBMISSION"
  });
  observability.observeLatencyMs(25);
  assert.equal(duplicateMetricCount, 1);
  assert.equal(outcomeCount, 1);
  assert.equal(latencyObserved, 25);
});

test("metrics registry wiring increments expected metrics", async () => {
  const registry = new Registry();
  const metrics = createManuscriptSubmissionMetrics({ registry });

  metrics.incrementOutcome("SUCCESS");
  metrics.incrementDuplicateConflict();
  metrics.observeLatencyMs(120);

  const snapshot = await registry.getMetricsAsJSON();
  const names = snapshot.map((row) => row.name);
  assert.equal(names.includes("manuscript_submission_outcomes_total"), true);
  assert.equal(names.includes("manuscript_submission_duplicate_conflicts_total"), true);
  assert.equal(names.includes("manuscript_submission_latency_ms"), true);

  const defaultMetrics = createManuscriptSubmissionMetrics();
  defaultMetrics.incrementOutcome("SUCCESS");
});

test("middleware guards enforce session and transport security", async () => {
  const auth = createAuthorSessionAuth({
    sessionRepository: {
      async getSessionById(sessionId: string) {
        if (sessionId === "active-author") {
          return {
            sessionId,
            accountId: "a1",
            role: "AUTHOR",
            status: "ACTIVE" as const
          };
        }

        if (sessionId === "active-editor") {
          return {
            sessionId,
            accountId: "a2",
            role: "EDITOR",
            status: "ACTIVE" as const
          };
        }

        if (sessionId === "expired-author") {
          return {
            sessionId,
            accountId: "a1",
            role: "AUTHOR",
            status: "EXPIRED" as const
          };
        }

        return null;
      }
    }
  });

  const makeReply = () => ({
    statusCode: 0,
    payload: undefined as unknown,
    code(value: number) {
      this.statusCode = value;
      return this;
    },
    send(value: unknown) {
      this.payload = value;
      return this;
    }
  });

  const missingReply = makeReply();
  const missingRequest = { headers: {} } as Parameters<typeof auth>[0];
  await auth(missingRequest, missingReply as never);
  assert.equal(missingReply.statusCode, 401);

  const emptyCookieReply = makeReply();
  const emptyCookieRequest = {
    headers: { cookie: "cms_session=; other=value" }
  } as Parameters<typeof auth>[0];
  await auth(emptyCookieRequest, emptyCookieReply as never);
  assert.equal(emptyCookieReply.statusCode, 401);

  const invalidReply = makeReply();
  const invalidRequest = {
    headers: { cookie: "other=missing" }
  } as Parameters<typeof auth>[0];
  await auth(invalidRequest, invalidReply as never);
  assert.equal(invalidReply.statusCode, 401);

  const roleReply = makeReply();
  const roleRequest = {
    headers: { cookie: "cms_session=active-editor" }
  } as Parameters<typeof auth>[0];
  await auth(roleRequest, roleReply as never);
  assert.equal(roleReply.statusCode, 403);

  const expiredReply = makeReply();
  const expiredRequest = {
    headers: { cookie: "cms_session=expired-author" }
  } as Parameters<typeof auth>[0];
  await auth(expiredRequest, expiredReply as never);
  assert.equal(expiredReply.statusCode, 401);

  const successReply = makeReply();
  const successRequest = {
    headers: { cookie: "other=1; cms_session=active-author; x=3" }
  } as Parameters<typeof auth>[0];
  await auth(successRequest, successReply as never);
  assert.equal(successReply.statusCode, 0);
  assert.deepEqual(successRequest.authorAuth, {
    authorId: "a1",
    sessionId: "active-author"
  });

  const secureReply = makeReply();
  const secureRequest = { headers: { "x-forwarded-proto": "https" }, id: "req-1" };
  await requireTransportSecurity(secureRequest as never, secureReply as never);
  assert.equal(secureReply.statusCode, 0);

  const insecureReply = makeReply();
  const insecureRequest = { headers: {}, id: "req-2" };
  await requireTransportSecurity(insecureRequest as never, insecureReply as never);
  assert.equal(insecureReply.statusCode, 426);
});

test("conference cycle repository options and submit-service requirement branches are covered", async () => {
  const openRepository = new InMemoryConferenceCycleRepository();
  const closedRepository = new InMemoryConferenceCycleRepository({ intakeStatus: "CLOSED" });
  assert.equal((await openRepository.getActiveCycle()).intakeStatus, "OPEN");
  assert.equal((await closedRepository.getActiveCycle()).intakeStatus, "CLOSED");

  const submissionRepository = new InMemoryManuscriptSubmissionRepository();
  const artifactRepository = new InMemoryManuscriptArtifactRepository();
  const auditRepository = new InMemorySubmissionAttemptAuditRepository();
  const service = new SubmitManuscriptService({
    conferenceCycleRepository: closedRepository,
    submissionRepository,
    artifactRepository,
    metadataPolicyService: new SubmissionMetadataPolicyService(),
    fileValidationService: new ManuscriptFileValidationService({
      storageAdapter: new InMemoryManuscriptStorageAdapter()
    }),
    deduplicationService: new SubmissionDeduplicationService({ submissionRepository }),
    handoffService: new SubmissionHandoffService({
      async markDownstreamAvailable() {}
    }),
    observabilityService: new ManuscriptSubmissionObservabilityService({
      auditRepository
    })
  });

  const noAuthorRequirements = await service.getRequirements(null);
  assert.equal(noAuthorRequirements.outcome, "INTAKE_CLOSED");

  const closedRequirements = await service.getRequirements("a1");
  assert.equal(closedRequirements.outcome, "INTAKE_CLOSED");

  const result = await service.submit({
    authorId: "a1",
    requestId: "r1",
    sourceIp: "127.0.0.1",
    body: { metadata: {}, manuscriptFile: {} }
  });
  assert.equal(result.outcome, "INTAKE_CLOSED");

  const serviceWithCustomRequiredField = new SubmitManuscriptService({
    conferenceCycleRepository: openRepository,
    submissionRepository,
    artifactRepository,
    metadataPolicyService: {
      getRequiredFields() {
        return ["title", "nonStandardRequiredField"];
      },
      buildRequirements(cycle) {
        return new SubmissionMetadataPolicyService().buildRequirements(cycle);
      }
    },
    fileValidationService: new ManuscriptFileValidationService({
      storageAdapter: new InMemoryManuscriptStorageAdapter()
    }),
    deduplicationService: new SubmissionDeduplicationService({ submissionRepository }),
    handoffService: new SubmissionHandoffService({
      async markDownstreamAvailable() {}
    }),
    observabilityService: new ManuscriptSubmissionObservabilityService({
      auditRepository
    })
  });

  const metadataRuleOutcome = await serviceWithCustomRequiredField.submit({
    authorId: "a1",
    requestId: "r2",
    sourceIp: "127.0.0.1",
    body: {
      metadata: {
        title: "Valid title",
        abstract: "Valid abstract",
        keywords: ["k"],
        fullAuthorList: [{ name: "A" }],
        correspondingAuthorEmail: "a@example.com",
        primarySubjectArea: "SE"
      },
      manuscriptFile: {
        filename: "paper.pdf",
        mediaType: "application/pdf",
        byteSize: 10,
        sha256Digest: "a".repeat(64)
      }
    }
  });
  assert.equal(metadataRuleOutcome.outcome, "VALIDATION_FAILED");

  const digestFailureOutcome = await serviceWithCustomRequiredField.submit({
    authorId: "a1",
    requestId: "r3",
    sourceIp: "127.0.0.1",
    body: {
      metadata: {
        title: "Valid title",
        abstract: "Valid abstract",
        keywords: ["k"],
        fullAuthorList: [{ name: "A" }],
        correspondingAuthorEmail: "a@example.com",
        primarySubjectArea: "SE",
        nonStandardRequiredField: "present"
      },
      manuscriptFile: {
        filename: "paper.pdf",
        mediaType: "application/pdf",
        byteSize: 10,
        sha256Digest: "short"
      }
    }
  });
  assert.equal(digestFailureOutcome.outcome, "VALIDATION_FAILED");

  const serviceWithStandardPolicy = new SubmitManuscriptService({
    conferenceCycleRepository: openRepository,
    submissionRepository,
    artifactRepository,
    metadataPolicyService: new SubmissionMetadataPolicyService(),
    fileValidationService: new ManuscriptFileValidationService({
      storageAdapter: new InMemoryManuscriptStorageAdapter()
    }),
    deduplicationService: new SubmissionDeduplicationService({ submissionRepository }),
    handoffService: new SubmissionHandoffService({
      async markDownstreamAvailable() {}
    }),
    observabilityService: new ManuscriptSubmissionObservabilityService({
      auditRepository
    })
  });

  const fileValidationOutcome = await serviceWithStandardPolicy.submit({
    authorId: "a1",
    requestId: "r4",
    sourceIp: "127.0.0.1",
    body: {
      metadata: {
        title: "File-validation branch",
        abstract: "Valid abstract",
        keywords: ["k"],
        fullAuthorList: [{ name: "A" }],
        correspondingAuthorEmail: "a@example.com",
        primarySubjectArea: "SE"
      },
      manuscriptFile: {
        filename: "paper.pdf",
        mediaType: "application/pdf",
        byteSize: 10,
        sha256Digest: "short"
      }
    }
  });
  assert.equal(fileValidationOutcome.outcome, "VALIDATION_FAILED");
});

test("submit service maps file validation failures without violations to empty violation array", async () => {
  const submissionRepository = new InMemoryManuscriptSubmissionRepository();
  const artifactRepository = new InMemoryManuscriptArtifactRepository();
  const auditRepository = new InMemorySubmissionAttemptAuditRepository();

  const service = new SubmitManuscriptService({
    conferenceCycleRepository: new InMemoryConferenceCycleRepository({ intakeStatus: "OPEN" }),
    submissionRepository,
    artifactRepository,
    metadataPolicyService: new SubmissionMetadataPolicyService(),
    fileValidationService: {
      async validateAndStore() {
        return {
          valid: false,
          outcome: "VALIDATION_FAILED" as const,
          message: "No file violations array provided"
        };
      }
    } as unknown as ManuscriptFileValidationService,
    deduplicationService: new SubmissionDeduplicationService({ submissionRepository }),
    handoffService: new SubmissionHandoffService({
      async markDownstreamAvailable() {}
    }),
    observabilityService: new ManuscriptSubmissionObservabilityService({
      auditRepository
    })
  });

  const result = await service.submit({
    authorId: "a1",
    requestId: "r-file-fallback",
    sourceIp: "127.0.0.1",
    body: {
      metadata: {
        title: "Valid title",
        abstract: "Valid abstract",
        keywords: ["k"],
        fullAuthorList: [{ name: "A" }],
        correspondingAuthorEmail: "a@example.com",
        primarySubjectArea: "SE"
      },
      manuscriptFile: {
        filename: "paper.pdf",
        mediaType: "application/pdf",
        byteSize: 10,
        sha256Digest: "a".repeat(64)
      }
    }
  });

  assert.equal(result.outcome, "VALIDATION_FAILED");
  if (result.outcome === "VALIDATION_FAILED") {
    assert.deepEqual(result.violations, []);
  }
});

test("manuscript controller handles authless flow and forwarded-for parsing", async () => {
  const app = Fastify({ logger: false, genReqId: () => "req_controller_uc05" });
  let capturedSourceIp = "";

  app.register(
    createManuscriptSubmissionsRoute({
      submitManuscriptService: {
        async getRequirements() {
          return {
            outcome: "REQUIREMENTS",
            cycleId: "cycle-1",
            intakeStatus: "OPEN",
            metadataPolicyVersion: "v1",
            requiredMetadataFields: [],
            fileConstraints: { allowedMediaTypes: ["application/pdf"], maxBytes: 10 }
          } as const;
        },
        async submit(input) {
          capturedSourceIp = input.sourceIp;
          return {
            outcome: "SUCCESS",
            submissionId: "00000000-0000-4000-8000-0000000005ff",
            status: "SUBMITTED",
            message: "ok"
          } as const;
        }
      },
      async authorSessionAuth() {
        // intentionally omitted authorAuth to force 401 coverage path
      }
    })
  );

  await app.ready();

  const requirementsUnauthorized = await request(app.server)
    .get("/api/v1/manuscript-submissions/requirements")
    .set("x-forwarded-proto", "https");
  assert.equal(requirementsUnauthorized.status, 401);

  const submitUnauthorized = await request(app.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .send({});
  assert.equal(submitUnauthorized.status, 401);

  await app.close();

  const authenticatedApp = Fastify({ logger: false, genReqId: () => "req_controller_uc05_auth" });
  authenticatedApp.register(
    createManuscriptSubmissionsRoute({
      submitManuscriptService: {
        async getRequirements() {
          return {
            outcome: "REQUIREMENTS",
            cycleId: "cycle-1",
            intakeStatus: "OPEN",
            metadataPolicyVersion: "v1",
            requiredMetadataFields: [],
            fileConstraints: { allowedMediaTypes: ["application/pdf"], maxBytes: 10 }
          } as const;
        },
        async submit(input) {
          capturedSourceIp = input.sourceIp;
          return {
            outcome: "SUCCESS",
            submissionId: "00000000-0000-4000-8000-0000000005ff",
            status: "SUBMITTED",
            message: "ok"
          } as const;
        }
      },
      async authorSessionAuth(request) {
        request.authorAuth = {
          authorId: "a1",
          sessionId: "s1"
        };
      }
    })
  );

  await authenticatedApp.ready();

  const accepted = await request(authenticatedApp.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https")
    .set("x-forwarded-for", "203.0.113.10, 10.0.0.1")
    .send({});
  assert.equal(accepted.status, 201);
  assert.equal(capturedSourceIp, "203.0.113.10");

  const acceptedWithoutBody = await request(authenticatedApp.server)
    .post("/api/v1/manuscript-submissions")
    .set("x-forwarded-proto", "https");
  assert.equal(acceptedWithoutBody.status, 201);

  await authenticatedApp.close();
});

test("error catalog and manuscript redaction helper execute", async () => {
  const validationError = new ManuscriptValidationError([]);
  assert.equal(validationError.name, "ManuscriptValidationError");

  const authorizationError = new ManuscriptAuthorizationError();
  assert.equal(authorizationError.name, "ManuscriptAuthorizationError");

  const intakeClosedError = new ManuscriptIntakeClosedError();
  assert.equal(intakeClosedError.name, "ManuscriptIntakeClosedError");

  const duplicateError = new ManuscriptDuplicateError();
  assert.equal(duplicateError.name, "ManuscriptDuplicateError");

  const operationalError = new ManuscriptOperationalError();
  assert.equal(operationalError.name, "ManuscriptOperationalError");

  const redacted = redactManuscriptSubmissionLog({
    title: "My Paper",
    abstract: "Some abstract",
    manuscriptFile: "binary-data",
    sha256Digest: "abcdef",
    metadata: {
      keywords: ["x", "y"]
    }
  });

  assert.equal(redacted.title, "[REDACTED]");
  assert.equal(redacted.abstract, "[REDACTED]");
  assert.equal(redacted.manuscriptFile, "[REDACTED]");

  const module = await import("../../src/business/domain/manuscript-submission.js");
  assert.equal(typeof module, "object");
});
