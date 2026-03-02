import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveDraftPolicyVersion,
  validateDraftSaveInput
} from "../../src/business/submission-drafts/draftValidation.js";
import {
  SubmissionDraftAuthorizationError,
  SubmissionDraftOwnershipGuard
} from "../../src/security/submissionDraftOwnership.js";
import {
  mapGetDraftOutcomeToHttp,
  mapSaveDraftOutcomeToHttp
} from "../../src/presentation/submission-drafts/submissionDraftErrorMapper.js";
import { PrismaSubmissionDraftRepository } from "../../src/data/submission-drafts/PrismaSubmissionDraftRepository.js";
import {
  SubmissionDraftAuditService,
  redactSubmissionDraftAuditContext
} from "../../src/shared/audit/submissionDraftAudit.js";
import { SaveSubmissionDraftUseCase } from "../../src/business/submission-drafts/SaveSubmissionDraftUseCase.js";
import { GetSubmissionDraftUseCase } from "../../src/business/submission-drafts/GetSubmissionDraftUseCase.js";
import { createSaveSubmissionDraftHandler } from "../../src/presentation/submission-drafts/saveSubmissionDraftHandler.js";
import { createGetSubmissionDraftHandler } from "../../src/presentation/submission-drafts/getSubmissionDraftHandler.js";

test("draft validation enforces title baseline and provided-field rules", () => {
  const invalidShape = validateDraftSaveInput({
    draftPayload: {}
  });
  assert.equal(invalidShape.valid, false);

  const rootPathFallback = validateDraftSaveInput({
    title: "Valid",
    draftPayload: {},
    unexpectedTopLevelField: true
  });
  assert.equal(rootPathFallback.valid, false);

  const invalidTitle = validateDraftSaveInput({ title: "   ", draftPayload: {} });
  assert.equal(invalidTitle.valid, false);

  const invalidAbstract = validateDraftSaveInput({
    title: "Valid",
    draftPayload: { abstract: "" }
  });
  assert.equal(invalidAbstract.valid, false);

  const invalidKeywords = validateDraftSaveInput({
    title: "Valid",
    draftPayload: { keywords: ["ok", ""] }
  });
  assert.equal(invalidKeywords.valid, false);

  const valid = validateDraftSaveInput({
    title: "Valid",
    draftPayload: {
      abstract: "Abstract",
      keywords: ["systems"],
      correspondingAuthorEmail: "author@example.com"
    }
  });
  assert.equal(valid.valid, true);
  assert.equal(getActiveDraftPolicyVersion(), "CMS Draft Submission Policy v1.0");
});

test("ownership guard throws authorization error when author is not owner", async () => {
  const guard = new SubmissionDraftOwnershipGuard({
    async isSubmissionOwnedByAuthor() {
      return false;
    }
  });

  await assert.rejects(
    guard.assertOwnership("author-1", "submission-1"),
    SubmissionDraftAuthorizationError
  );
});

test("HTTP mappers cover save/get response branches", () => {
  assert.equal(
    mapSaveDraftOutcomeToHttp({
      outcome: "SUCCESS",
      submissionId: "sub-1",
      savedAt: new Date("2026-02-10T00:00:00.000Z").toISOString(),
      message: "Draft saved successfully.",
      policyVersion: "CMS Draft Submission Policy v1.0"
    }).statusCode,
    200
  );

  assert.equal(
    mapSaveDraftOutcomeToHttp({
      outcome: "VALIDATION_FAILED",
      code: "VALIDATION_FAILED",
      message: "Draft validation failed.",
      violations: []
    }).statusCode,
    400
  );

  assert.equal(
    mapSaveDraftOutcomeToHttp({
      outcome: "AUTHORIZATION_FAILED",
      code: "AUTHORIZATION_FAILED",
      message: "Forbidden"
    }).statusCode,
    403
  );

  assert.equal(
    mapSaveDraftOutcomeToHttp({
      outcome: "CONCURRENT_SAVE_RESOLVED",
      code: "CONCURRENT_SAVE_RESOLVED",
      message: "Conflict"
    }).statusCode,
    409
  );

  assert.equal(
    mapSaveDraftOutcomeToHttp({
      outcome: "OPERATIONAL_FAILURE",
      code: "OPERATIONAL_FAILURE",
      message: "Failure"
    }).statusCode,
    500
  );
  assert.equal(mapSaveDraftOutcomeToHttp({ outcome: "UNKNOWN" } as never).statusCode, 500);

  assert.equal(
    mapGetDraftOutcomeToHttp({
      outcome: "SUCCESS",
      submissionId: "sub-1",
      title: "Title",
      draftPayload: {},
      lastSavedAt: new Date("2026-02-10T00:00:00.000Z").toISOString(),
      policyVersion: "v1"
    }).statusCode,
    200
  );

  assert.equal(
    mapGetDraftOutcomeToHttp({
      outcome: "AUTHORIZATION_FAILED",
      code: "AUTHORIZATION_FAILED",
      message: "Forbidden"
    }).statusCode,
    403
  );

  assert.equal(
    mapGetDraftOutcomeToHttp({
      outcome: "DRAFT_NOT_FOUND",
      code: "DRAFT_NOT_FOUND",
      message: "Missing"
    }).statusCode,
    404
  );

  assert.equal(
    mapGetDraftOutcomeToHttp({
      outcome: "OPERATIONAL_FAILURE",
      code: "OPERATIONAL_FAILURE",
      message: "Failure"
    }).statusCode,
    500
  );
  assert.equal(mapGetDraftOutcomeToHttp({ outcome: "UNKNOWN" } as never).statusCode, 500);
});

test("audit service records attempt without leaking draft payload context", async () => {
  const repository = new PrismaSubmissionDraftRepository();
  const emitted: Array<Record<string, unknown>> = [];

  const audit = new SubmissionDraftAuditService({
    repository,
    emit: (event) => {
      emitted.push(event);
    }
  });

  await audit.recordAttempt({
    authorId: "author-1",
    submissionId: "submission-1",
    requestId: "req-1",
    outcome: "SUCCESS",
    reasonCode: "DRAFT_SAVED"
  });

  assert.equal(repository.getSaveAttempts().length, 1);
  assert.equal(JSON.stringify(repository.getSaveAttempts()).includes("draftPayload"), false);
  assert.equal(JSON.stringify(emitted).includes("author-1"), true);

  const redacted = redactSubmissionDraftAuditContext({
    title: "Sensitive",
    draftPayload: "secret",
    outcome: "SUCCESS"
  });
  assert.equal(redacted.title, "[REDACTED]");
  assert.equal(redacted.draftPayload, "[REDACTED]");
  assert.equal(redacted.outcome, "SUCCESS");
});

test("save/get use cases map operational failure branches", async () => {
  const repository = new PrismaSubmissionDraftRepository();
  const audit = new SubmissionDraftAuditService({ repository });

  const saveUseCase = new SaveSubmissionDraftUseCase({
    repository,
    ownershipGuard: {
      async assertOwnership() {
        throw new Error("lookup-down");
      }
    } as never,
    auditService: audit
  });

  const saveOutcome = await saveUseCase.execute({
    authorId: "author-1",
    submissionId: "submission-1",
    requestId: "req-1",
    body: { title: "A", draftPayload: {} }
  });
  assert.equal(saveOutcome.outcome, "OPERATIONAL_FAILURE");

  const getUseCaseLookupFailure = new GetSubmissionDraftUseCase({
    repository,
    ownershipGuard: {
      async assertOwnership() {
        throw new Error("lookup-down");
      }
    } as never
  });

  const getLookupFailure = await getUseCaseLookupFailure.execute({
    authorId: "author-1",
    submissionId: "submission-1"
  });
  assert.equal(getLookupFailure.outcome, "OPERATIONAL_FAILURE");

  const getUseCaseReadFailure = new GetSubmissionDraftUseCase({
    repository: new Proxy(repository, {
      get(target, property, receiver) {
        if (property === "getDraft") {
          return async () => {
            throw new Error("read-down");
          };
        }
        return Reflect.get(target, property, receiver);
      }
    }) as never,
    ownershipGuard: {
      async assertOwnership() {}
    } as never
  });

  const getReadFailure = await getUseCaseReadFailure.execute({
    authorId: "author-1",
    submissionId: "submission-1"
  });
  assert.equal(getReadFailure.outcome, "OPERATIONAL_FAILURE");
});

test("submission draft handlers return 401 if auth context is missing", async () => {
  const saveHandler = createSaveSubmissionDraftHandler({
    useCase: {
      async execute() {
        return {
          outcome: "SUCCESS",
          submissionId: "sub-1",
          savedAt: new Date("2026-02-10T00:00:00.000Z").toISOString(),
          message: "Draft saved successfully.",
          policyVersion: "v1"
        };
      }
    }
  });

  const getHandler = createGetSubmissionDraftHandler({
    useCase: {
      async execute() {
        return {
          outcome: "DRAFT_NOT_FOUND",
          code: "DRAFT_NOT_FOUND",
          message: "No saved draft exists for this submission."
        };
      }
    }
  });

  let saveStatus = 0;
  let getStatus = 0;
  let saveBody: Record<string, unknown> = {};
  let getBody: Record<string, unknown> = {};

  const saveReply = {
    header() {
      return this;
    },
    code(status: number) {
      saveStatus = status;
      return this;
    },
    send(body: Record<string, unknown>) {
      saveBody = body;
      return this;
    }
  };

  const getReply = {
    header() {
      return this;
    },
    code(status: number) {
      getStatus = status;
      return this;
    },
    send(body: Record<string, unknown>) {
      getBody = body;
      return this;
    }
  };

  await saveHandler(
    {
      id: "req-save",
      params: { submissionId: "sub-1" },
      body: {},
      authorAuth: undefined
    } as never,
    saveReply as never
  );

  await getHandler(
    {
      id: "req-get",
      params: { submissionId: "sub-1" },
      authorAuth: undefined
    } as never,
    getReply as never
  );

  assert.equal(saveStatus, 401);
  assert.equal(getStatus, 401);
  assert.equal(saveBody.code, "AUTHENTICATION_REQUIRED");
  assert.equal(getBody.code, "AUTHENTICATION_REQUIRED");
});

test("save handler maps undefined body to empty object payload", async () => {
  let receivedBody: unknown = null;

  const saveHandler = createSaveSubmissionDraftHandler({
    useCase: {
      async execute(input: { body: unknown }) {
        receivedBody = input.body;
        return {
          outcome: "SUCCESS",
          submissionId: "sub-1",
          savedAt: new Date("2026-02-10T00:00:00.000Z").toISOString(),
          message: "Draft saved successfully.",
          policyVersion: "v1"
        } as const;
      }
    }
  });

  let status = 0;
  const reply = {
    header() {
      return this;
    },
    code(next: number) {
      status = next;
      return this;
    },
    send() {
      return this;
    }
  };

  await saveHandler(
    {
      id: "req-save-2",
      params: { submissionId: "sub-1" },
      authorAuth: { authorId: "author-1", sessionId: "sess-1" },
      body: undefined
    } as never,
    reply as never
  );

  assert.deepEqual(receivedBody, {});
  assert.equal(status, 200);
});

test("draft repository utility branches for seeding and forced concurrency are covered", async () => {
  const repository = new PrismaSubmissionDraftRepository();

  repository.seedDraft({
    id: "11111111-1111-4111-8111-111111111111",
    authorId: "author-1",
    inProgressSubmissionId: "submission-1",
    title: "Seeded",
    draftPayload: {},
    payloadVersion: 1,
    policyVersion: "v1",
    lastSavedAt: new Date("2026-02-10T00:00:00.000Z"),
    encryptedAtRest: true
  });

  repository.setForceConcurrentResolutionFailure(true);
  await assert.rejects(
    repository.saveDraft({
      authorId: "author-1",
      submissionId: "submission-1",
      title: "Will Fail",
      draftPayload: {},
      policyVersion: "v1"
    })
  );
});
