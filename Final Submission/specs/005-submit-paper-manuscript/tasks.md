# Tasks: Submit Paper Manuscript

**Input**: Design documents from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/005-submit-paper-manuscript/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are REQUIRED. For each user story, create failing tests first and verify failure before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story so each story remains independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- All tasks include explicit file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize feature scaffolding and test harnesses.

- [ ] T001 Create manuscript-submission module folders in `backend/src/presentation/manuscripts/`, `backend/src/business/manuscripts/`, `backend/src/data/manuscripts/`, and `frontend/src/presentation/manuscripts/`
- [ ] T002 Create shared manuscript domain types and error catalog in `backend/src/business/domain/manuscript-submission.ts` and `backend/src/shared/errors/manuscript-submission-errors.ts`
- [ ] T003 [P] Create migration scaffold for manuscript submission entities in `infra/db/migrations/005_submit_paper_manuscript.sql`
- [ ] T004 [P] Create contract test scaffold for manuscript submissions in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T005 [P] Create integration test scaffold for manuscript submissions in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T006 [P] Create e2e test scaffold for manuscript submission UI in `frontend/tests/e2e/submit-manuscript.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement required shared controls before user-story delivery.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

### Tests for Foundational Controls (REQUIRED) ⚠️

- [ ] T007 [P] Add failing integration test for unauthenticated/expired-session rejection in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T008 [P] Add failing integration test for intake-open/intake-closed gating behavior in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T009 [P] Add failing integration test for deterministic duplicate single-winner behavior in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T010 [P] Add failing integration test for encrypted-storage and integrity-metadata persistence in `backend/tests/integration/manuscript-submissions.integration.test.ts`

### Implementation for Foundational Controls

- [ ] T011 Implement authenticated author-session guard middleware for submission endpoints in `backend/src/presentation/middleware/author-session-auth.ts`
- [ ] T012 [P] Implement request schema validation for metadata payload and file metadata in `backend/src/business/validation/manuscript-submission.schema.ts`
- [ ] T013 [P] Implement title normalization utility using FR-016 rule order in `backend/src/business/manuscripts/title-normalization.service.ts`
- [ ] T014 Implement data repositories for `ManuscriptSubmission` and `SubmissionMetadataPackage` in `backend/src/data/manuscripts/manuscript-submission.repository.ts`
- [ ] T015 [P] Implement data repository for `ManuscriptArtifact` with integrity fields in `backend/src/data/manuscripts/manuscript-artifact.repository.ts`
- [ ] T016 [P] Implement data repository for `SubmissionAttemptAudit` in `backend/src/data/manuscripts/submission-attempt-audit.repository.ts`
- [ ] T017 Implement conference-cycle policy lookup for intake status and metadata policy version in `backend/src/data/manuscripts/conference-cycle.repository.ts`
- [ ] T018 [P] Implement encrypted object-storage adapter for manuscript files in `backend/src/data/manuscripts/manuscript-storage.adapter.ts`
- [ ] T019 Implement deterministic duplicate-check and single-winner transaction boundary in `backend/src/business/manuscripts/submission-deduplication.service.ts`
- [ ] T020 [P] Implement audit and metrics wrappers for submission outcomes in `backend/src/business/observability/manuscript-submission-observability.service.ts`
- [ ] T021 Implement controller/router skeleton for `GET /api/v1/manuscript-submissions/requirements` and `POST /api/v1/manuscript-submissions` in `backend/src/presentation/manuscripts/manuscript-submissions.controller.ts`

**Checkpoint**: Foundation complete; user stories can begin.

---

## Phase 3: User Story 1 - Successful Manuscript Submission (Priority: P1) 🎯 MVP

**Goal**: Allow an authenticated author to retrieve active-cycle requirements and successfully submit valid metadata with a valid PDF manuscript.

**Independent Test**: From an authenticated author session with intake open, fetch requirements and submit valid metadata + valid PDF <= 20 MB; verify `201` response, accepted submission state, and downstream availability flag.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T022 [P] [US1] Add failing contract test for requirements retrieval `200` response in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T023 [P] [US1] Add failing contract test for submission success `201` response in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T024 [P] [US1] Add failing integration test for atomic persistence of submission, metadata, artifact, and audit rows in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T025 [P] [US1] Add failing e2e success-path test for author submission flow in `frontend/tests/e2e/submit-manuscript.spec.ts`
- [ ] T026 [P] [US1] Add failing integration test verifying accepted submissions are visible to downstream intake checks in `backend/tests/integration/manuscript-submissions.integration.test.ts`

### Implementation for User Story 1

- [ ] T027 [US1] Implement requirements endpoint success path in `backend/src/presentation/manuscripts/manuscript-submissions.controller.ts`
- [ ] T028 [US1] Implement submission orchestration success path in `backend/src/business/manuscripts/submit-manuscript.service.ts`
- [ ] T029 [US1] Implement metadata-policy field enforcement (`FR-012a`) in `backend/src/business/manuscripts/submission-metadata-policy.service.ts`
- [ ] T030 [US1] Implement PDF/size/integrity validation and storage adapter invocation in `backend/src/business/manuscripts/manuscript-file-validation.service.ts`
- [ ] T031 [US1] Implement transactional persistence for accepted submission graph in `backend/src/data/manuscripts/manuscript-submission.repository.ts`
- [ ] T032 [US1] Implement downstream review-intake availability marker/event on accepted submission in `backend/src/business/manuscripts/submission-handoff.service.ts`
- [ ] T033 [US1] Implement frontend API client methods for requirements and submit success in `frontend/src/business/manuscripts/manuscript-submission.client.ts`
- [ ] T034 [US1] Implement submission form success flow and confirmation UI in `frontend/src/presentation/manuscripts/submit-manuscript-form.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Metadata Validation Failure and Recovery (Priority: P1)

**Goal**: Reject missing/invalid metadata with explicit field-level guidance and enable correction/resubmission without creating accepted state.

**Independent Test**: Submit with missing/invalid required metadata while authenticated and intake open; verify explicit validation violations, no accepted submission persisted, and successful resubmission after correction.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T035 [P] [US2] Add failing contract tests for metadata-validation `400` responses with violations array in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T036 [P] [US2] Add failing integration tests for metadata invalidation and no accepted persistence behavior in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T037 [P] [US2] Add failing e2e test for metadata error correction and resubmission in `frontend/tests/e2e/submit-manuscript.spec.ts`
- [ ] T038 [P] [US2] Add failing contract test for intake-closed `409 INTAKE_CLOSED` response with user-visible guidance in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T039 [P] [US2] Add failing e2e test for intake-closed submission attempt and guidance message in `frontend/tests/e2e/submit-manuscript.spec.ts`

### Implementation for User Story 2

- [ ] T040 [US2] Implement explicit metadata-rule violation mapping in `backend/src/business/manuscripts/submission-metadata-validation.service.ts`
- [ ] T041 [US2] Implement metadata failure response shaping (`code/message/violations`) in `backend/src/presentation/manuscripts/manuscript-submissions.controller.ts`
- [ ] T042 [US2] Implement intake-closed response mapping with explicit user guidance in `backend/src/presentation/manuscripts/manuscript-submissions.controller.ts`
- [ ] T043 [US2] Implement rollback-on-metadata-failure guarantees before accepted-state write in `backend/src/business/manuscripts/submit-manuscript.service.ts`
- [ ] T044 [US2] Implement frontend metadata error rendering and retry wiring in `frontend/src/presentation/manuscripts/submit-manuscript-errors.tsx`
- [ ] T045 [US2] Implement client-side typing/handling for metadata `400` and intake-closed `409` response contracts in `frontend/src/business/manuscripts/manuscript-submission.client.ts`

**Checkpoint**: User Stories 1 and 2 both pass independently.

---

## Phase 5: User Story 3 - Manuscript File Validation Failure and Recovery (Priority: P1)

**Goal**: Reject invalid manuscript files (type/size/integrity violations) with explicit feedback and allow corrected resubmission.

**Independent Test**: Submit valid metadata with invalid file type/size while authenticated and intake open; verify explicit file-rule feedback, no accepted submission persisted, and acceptance after valid replacement file.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T046 [P] [US3] Add failing contract tests for file failure statuses (`413`, `415`) in `backend/tests/contract/manuscript-submissions.contract.test.ts`
- [ ] T047 [P] [US3] Add failing integration tests for file-validation rejection and no accepted persistence behavior in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T048 [P] [US3] Add failing e2e test for invalid-file feedback and corrected retry in `frontend/tests/e2e/submit-manuscript.spec.ts`

### Implementation for User Story 3

- [ ] T049 [US3] Implement explicit file validation failure reason mapping in `backend/src/business/manuscripts/manuscript-file-validation.service.ts`
- [ ] T050 [US3] Implement file error response handling for `413/415` in `backend/src/presentation/manuscripts/manuscript-submissions.controller.ts`
- [ ] T051 [US3] Implement no-partial-state guarantees for late file validation and operational failures in `backend/src/business/manuscripts/submit-manuscript.service.ts`
- [ ] T052 [US3] Implement frontend file-error state rendering and retry flow in `frontend/src/presentation/manuscripts/submit-manuscript-errors.tsx`
- [ ] T053 [US3] Implement client-side handling for file failure status codes in `frontend/src/business/manuscripts/manuscript-submission.client.ts`

**Checkpoint**: User Stories 1, 2, and 3 all pass independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, observability, and release-readiness checks.

- [ ] T054 [P] Add log-redaction coverage to prevent manuscript content leakage in `backend/src/shared/logging/redaction.ts`
- [ ] T055 [P] Add Prometheus counters/timers for submission outcomes and duplicate conflicts in `backend/src/business/observability/manuscript-submission-metrics.ts`
- [ ] T056 [P] Add integration test for concurrent same-author duplicate single-winner guarantee in `backend/tests/integration/manuscript-submissions.concurrency.test.ts`
- [ ] T057 [P] Add integration performance test for p95 latency target in `backend/tests/integration/manuscript-submissions.performance.test.ts`
- [ ] T058 Validate OpenAPI response examples and error codes against behavior in `specs/005-submit-paper-manuscript/contracts/manuscript-submissions.openapi.yaml`
- [ ] T059 Record Chrome/Firefox submission-flow verification evidence in `specs/005-submit-paper-manuscript/quickstart.md`
- [ ] T060 Record backup/restore impact verification for new submission data in `infra/ops/recovery/manuscript-submission-recovery.md`
- [ ] T061 Record constitution compliance evidence for this feature in `specs/005-submit-paper-manuscript/plan.md`
- [ ] T062 [P] Add backend runtime guard rejecting non-TLS forwarded requests for submission endpoints in `backend/src/presentation/middleware/transport-security.ts`
- [ ] T063 [P] Add integration test verifying non-TLS submission requests are rejected in `backend/tests/integration/manuscript-submissions.integration.test.ts`
- [ ] T064 Record TLS-only endpoint verification evidence for manuscript submission in `specs/005-submit-paper-manuscript/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; may reuse US1 components but remains independently testable.
- **Phase 5 (US3)**: Depends on Phase 2; may reuse US1 components but remains independently testable.
- **Phase 6 (Polish)**: Depends on completed user stories.

### User Story Completion Order

1. **US1 (P1) - MVP success path**
2. **US2 (P1) - metadata failure and recovery**
3. **US3 (P1) - file failure and recovery**

### Within Each User Story

- Write tests first, verify they fail, then implement.
- Keep presentation/business/data responsibilities separated.
- Story is complete only when its independent test criteria passes.

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel test-first tasks
T022 backend/tests/contract/manuscript-submissions.contract.test.ts
T024 backend/tests/integration/manuscript-submissions.integration.test.ts
T025 frontend/tests/e2e/submit-manuscript.spec.ts
```

### User Story 2

```bash
# Parallel test-first tasks
T035 backend/tests/contract/manuscript-submissions.contract.test.ts
T036 backend/tests/integration/manuscript-submissions.integration.test.ts
T037 frontend/tests/e2e/submit-manuscript.spec.ts
```

### User Story 3

```bash
# Parallel test-first tasks
T046 backend/tests/contract/manuscript-submissions.contract.test.ts
T047 backend/tests/integration/manuscript-submissions.integration.test.ts
T048 frontend/tests/e2e/submit-manuscript.spec.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate independent test for US1 before expanding scope.

### Incremental Delivery

1. Deliver US1 (successful submission path).
2. Deliver US2 (metadata failure/recovery path).
3. Deliver US3 (file failure/recovery path).
4. Execute Phase 6 hardening and release checks.

### Parallel Team Strategy

1. Complete foundational work together.
2. Split parallelizable `[P]` tasks across backend, frontend, and test streams.
3. Merge only after per-story independent tests pass.

---

## Notes

- Tasks marked `[P]` are safe parallel candidates when their dependencies are satisfied.
- `[US1]`, `[US2]`, and `[US3]` labels provide explicit story traceability to UC-05 and AT-UC05-01/02/03.
- Every task line follows the required checklist format with checkbox, task ID, optional markers, and explicit file path.
