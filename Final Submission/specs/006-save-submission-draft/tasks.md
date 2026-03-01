# Tasks: Save Paper Submission Draft

**Input**: Design documents from `/specs/006-save-submission-draft/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are REQUIRED for this feature by constitution and plan; use Red-Green-Refactor per story.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared project and tooling context for UC-06 implementation.

- [ ] T001 Validate feature scaffolding and create draft module folders in `backend/src/presentation/submission-drafts/`, `backend/src/business/submission-drafts/`, and `backend/src/data/submission-drafts/`
- [ ] T002 Create feature-specific frontend folders in `frontend/src/presentation/submission-drafts/`, `frontend/src/business/submission-drafts/`, and `frontend/src/data/submission-drafts/`
- [ ] T003 [P] Register contract artifact location and lint checks for `specs/006-save-submission-draft/contracts/submission-drafts.openapi.yaml` in `backend/package.json`
- [ ] T004 [P] Add test suite placeholders for UC-06 in `backend/tests/contract/submission-drafts/`, `backend/tests/integration/submission-drafts/`, and `frontend/tests/e2e/submission-drafts/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core persistence, auth, validation, observability, and migration foundations used by all stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [ ] T005 [P] Add failing integration test for one-current-draft uniqueness constraint in `backend/tests/integration/submission-drafts/draftUniqueness.foundation.integration.test.ts`
- [ ] T006 [P] Add failing integration test for submission-draft ownership enforcement in `backend/tests/integration/submission-drafts/ownershipGuard.foundation.integration.test.ts`
- [ ] T007 [P] Add failing integration test for title-required draft baseline validation in `backend/tests/integration/submission-drafts/validationBaseline.foundation.integration.test.ts`
- [ ] T008 [P] Add failing integration test for draft-save audit redaction baseline in `backend/tests/integration/submission-drafts/auditFoundation.redaction.integration.test.ts`
- [ ] T009 Create database migration for `SubmissionDraft`, `DraftSnapshot`, and `DraftSaveAttempt` tables with one-current-draft uniqueness in `backend/prisma/migrations/*_submission_drafts_uc06/migration.sql`
- [ ] T010 Update Prisma schema for UC-06 entities and enums in `backend/prisma/schema.prisma`
- [ ] T011 [P] Implement shared draft DTO validation schemas (title baseline + provided-field validation) in `backend/src/business/submission-drafts/draftValidation.ts`
- [ ] T012 [P] Implement shared ownership/authorization guard helpers for submission draft access in `backend/src/security/submissionDraftOwnership.ts`
- [ ] T013 Implement draft repository interfaces and transaction boundary contracts in `backend/src/data/submission-drafts/SubmissionDraftRepository.ts`
- [ ] T014 [P] Implement audit event model and logger helpers (without payload logging) in `backend/src/shared/audit/submissionDraftAudit.ts`
- [ ] T015 [P] Add backup/restore coverage notes for new tables in `infra/ops/backup-restore.md`

**Checkpoint**: Persistence, auth, validation, and audit foundations are ready.

---

## Phase 3: User Story 1 - Save Valid Draft State (Priority: P1) 🎯 MVP

**Goal**: Allow authenticated author to save a valid draft and receive explicit success confirmation.

**Independent Test**: With valid payload and ownership, save draft and confirm persisted current draft + success response.

### Tests for User Story 1 (REQUIRED)

- [ ] T016 [P] [US1] Add failing contract test for `PUT /api/v1/submission-drafts/{submissionId}` success response in `backend/tests/contract/submission-drafts/saveDraft.success.contract.test.ts`
- [ ] T017 [P] [US1] Add failing integration test for first valid save persistence in `backend/tests/integration/submission-drafts/saveDraft.success.integration.test.ts`
- [ ] T018 [P] [US1] Add failing integration test for overwrite behavior on repeated valid saves in `backend/tests/integration/submission-drafts/saveDraft.overwrite.integration.test.ts`
- [ ] T019 [P] [US1] Add failing UI/e2e test for visible save confirmation in `frontend/tests/e2e/submission-drafts/saveDraft.success.e2e.test.ts`

### Implementation for User Story 1

- [ ] T020 [US1] Implement save-draft use case orchestration and success path in `backend/src/business/submission-drafts/SaveSubmissionDraftUseCase.ts`
- [ ] T021 [US1] Implement transactional repository save + snapshot creation + last-write-wins update in `backend/src/data/submission-drafts/PrismaSubmissionDraftRepository.ts`
- [ ] T022 [US1] Implement presentation endpoint handler for successful save response in `backend/src/presentation/submission-drafts/saveSubmissionDraftHandler.ts`
- [ ] T023 [US1] Implement frontend draft-save API client in `frontend/src/data/submission-drafts/saveSubmissionDraftClient.ts`
- [ ] T024 [US1] Implement frontend save action workflow and success message state in `frontend/src/business/submission-drafts/saveDraftAction.ts`
- [ ] T025 [US1] Implement draft save UI trigger and success feedback rendering in `frontend/src/presentation/submission-drafts/SubmissionDraftSavePanel.tsx`
- [ ] T026 [US1] Emit success attempt audit event with non-sensitive fields in `backend/src/shared/audit/submissionDraftAudit.ts`

**Checkpoint**: US1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Reject Invalid Draft Save Request (Priority: P1)

**Goal**: Reject invalid/unauthorized draft save requests with explicit user-visible feedback and no resumable-state mutation.

**Independent Test**: Submit invalid or unauthorized save; verify explicit error details and unchanged resumable draft state.

### Tests for User Story 2 (REQUIRED)

- [ ] T027 [P] [US2] Add failing contract tests for `400`, `401`, and `403` save-draft responses in `backend/tests/contract/submission-drafts/saveDraft.errors.contract.test.ts`
- [ ] T028 [P] [US2] Add failing integration test for validation failure preserving prior valid draft in `backend/tests/integration/submission-drafts/saveDraft.validationFailure.integration.test.ts`
- [ ] T029 [P] [US2] Add failing integration test for expired-session/unauthenticated rejection in `backend/tests/integration/submission-drafts/saveDraft.authnFailure.integration.test.ts`
- [ ] T030 [P] [US2] Add failing integration test for non-owner rejection in `backend/tests/integration/submission-drafts/saveDraft.authzFailure.integration.test.ts`
- [ ] T031 [P] [US2] Add failing UI/e2e test for explicit validation issue messaging in `frontend/tests/e2e/submission-drafts/saveDraft.validationError.e2e.test.ts`

### Implementation for User Story 2

- [ ] T032 [US2] Implement invalid-draft rule evaluation and structured violation mapping in `backend/src/business/submission-drafts/draftValidation.ts`
- [ ] T033 [US2] Implement authn/authz enforcement path for save endpoint in `backend/src/presentation/submission-drafts/saveSubmissionDraftHandler.ts`
- [ ] T034 [US2] Implement no-mutation-on-failure safeguards in draft persistence service in `backend/src/business/submission-drafts/SaveSubmissionDraftUseCase.ts`
- [ ] T035 [US2] Implement explicit error response mapper for validation/auth errors in `backend/src/presentation/submission-drafts/submissionDraftErrorMapper.ts`
- [ ] T036 [US2] Implement frontend error rendering for validation and authorization failures in `frontend/src/presentation/submission-drafts/SubmissionDraftSavePanel.tsx`
- [ ] T037 [US2] Emit validation/auth failure audit events (without payload) in `backend/src/shared/audit/submissionDraftAudit.ts`

**Checkpoint**: US2 is fully functional and independently testable.

---

## Phase 5: User Story 3 - Resume From Saved Draft State (Priority: P2)

**Goal**: Allow the owning author to retrieve and continue from the most recently saved valid draft state.

**Independent Test**: After successful save, later retrieval returns latest draft state for owning author only.

### Tests for User Story 3 (REQUIRED)

- [ ] T038 [P] [US3] Add failing contract tests for `GET /api/v1/submission-drafts/{submissionId}` (`200`, `401`, `403`, `404`) in `backend/tests/contract/submission-drafts/getDraft.contract.test.ts`
- [ ] T039 [P] [US3] Add failing integration test for successful owner resume retrieval in `backend/tests/integration/submission-drafts/getDraft.success.integration.test.ts`
- [ ] T040 [P] [US3] Add failing integration test for no-draft-found behavior in `backend/tests/integration/submission-drafts/getDraft.notFound.integration.test.ts`
- [ ] T041 [P] [US3] Add failing UI/e2e test for draft rehydration into submission form in `frontend/tests/e2e/submission-drafts/resumeDraft.e2e.test.ts`

### Implementation for User Story 3

- [ ] T042 [US3] Implement get-draft use case with ownership enforcement in `backend/src/business/submission-drafts/GetSubmissionDraftUseCase.ts`
- [ ] T043 [US3] Implement get-draft data access in `backend/src/data/submission-drafts/PrismaSubmissionDraftRepository.ts`
- [ ] T044 [US3] Implement get-draft presentation endpoint handler in `backend/src/presentation/submission-drafts/getSubmissionDraftHandler.ts`
- [ ] T045 [US3] Implement frontend get-draft API client in `frontend/src/data/submission-drafts/getSubmissionDraftClient.ts`
- [ ] T046 [US3] Implement draft resume workflow state hydration in `frontend/src/business/submission-drafts/resumeDraftAction.ts`
- [ ] T047 [US3] Implement submission form resume rendering from saved draft in `frontend/src/presentation/submission-drafts/SubmissionDraftEditor.tsx`

**Checkpoint**: US3 is fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize reliability, observability, and release readiness for UC-06.

- [ ] T048 [P] Add concurrency integration test for deterministic last-write-wins saves in `backend/tests/integration/submission-drafts/saveDraft.concurrency.integration.test.ts`
- [ ] T049 [P] Add integration test for operational-failure path preserving previous valid draft in `backend/tests/integration/submission-drafts/saveDraft.operationalFailure.integration.test.ts`
- [ ] T050 [P] Verify no plaintext draft payload leakage in logs via log-safety test in `backend/tests/integration/submission-drafts/auditLog.redaction.integration.test.ts`
- [ ] T051 [P] Validate Chrome and Firefox draft save/resume behavior in `frontend/tests/e2e/submission-drafts/`
- [ ] T052 Update quickstart verification steps and evidence links in `specs/006-save-submission-draft/quickstart.md`
- [ ] T053 [P] Add failing integration test for TLS-only draft-save and draft-resume transport behavior in `backend/tests/integration/submission-drafts/transportSecurity.integration.test.ts`
- [ ] T054 Implement draft-route transport security enforcement in `backend/src/presentation/submission-drafts/submissionDraftRouteSecurity.ts`
- [ ] T055 [P] Add failing integration test for encrypted-at-rest draft persistence and backup coverage in `backend/tests/integration/submission-drafts/atRestProtection.integration.test.ts`
- [ ] T056 Implement encrypted-at-rest storage and backup verification wiring for draft records in `backend/src/data/submission-drafts/PrismaSubmissionDraftRepository.ts` and `infra/ops/backup-restore.md`

---

## Dependencies & Execution Order

### Story Dependency Graph

- Foundational (Phase 2) -> US1 (Phase 3)
- Foundational (Phase 2) -> US2 (Phase 4)
- Foundational (Phase 2) -> US3 (Phase 5)
- US1 (Phase 3) -> US3 (Phase 5)
- US1 + US2 + US3 -> Polish (Phase 6)

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: depends on Phase 2.
- **Phase 4 (US2)**: depends on Phase 2.
- **Phase 5 (US3)**: depends on Phase 2 and benefits from US1 completion.
- **Phase 6 (Polish)**: depends on completed story phases.

### Within Each Story

- Write tests first and confirm they fail before implementation.
- Implement backend business/data/presentation before frontend integration where endpoint contracts are needed.
- Complete explicit user-visible error paths before story sign-off.

## Parallel Execution Examples

### User Story 1

- Run in parallel: `T016`, `T017`, `T018`, `T019` (different test files).
- After `T020`, run `T021` and `T022` in sequence; run `T023` in parallel with backend implementation once contract is stable.

### User Story 2

- Run in parallel: `T027`, `T028`, `T029`, `T030`, `T031`.
- Run `T032` and `T035` in parallel (validation logic vs response mapping), then complete `T033`, `T034`, `T036`, `T037`.

### User Story 3

- Run in parallel: `T038`, `T039`, `T040`, `T041`.
- Run `T043` and `T044` after `T042`; run `T045` and `T046` in parallel before `T047`.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) as MVP.
3. Validate US1 contract/integration/e2e behavior before expanding scope.

### Incremental Delivery

1. Add Phase 4 (US2) to enforce validation and authorization error behavior.
2. Add Phase 5 (US3) for resume retrieval workflow.
3. Finish with Phase 6 hardening and operational validation.

### Team Parallelization

1. One engineer executes persistence/migrations (`T009`, `T010`, `T013`).
2. One engineer executes backend validation/auth/audit (`T011`, `T012`, `T014`).
3. One engineer prepares frontend scaffolding/tests (`T002`, `T004`) and later story UI tasks.

## Notes

- All tasks use exact file paths and strict checklist format.
- `[P]` denotes tasks that can run in parallel without conflicting file edits.
- User story labels are applied only in user story phases.
