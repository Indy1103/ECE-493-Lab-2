# Tasks: Submit Paper Review

**Input**: Design documents from `/specs/010-submit-paper-review/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. For every user story, write tests first and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `infra/`
- **Backend layers**: `presentation/`, `business/`, `data/`
- **Frontend layers**: `presentation/`, `business/`, `data/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project scaffolding and quality tooling for UC-10

- [ ] T001 Create feature module skeletons for review submission in `backend/src/presentation/review-submission/`, `backend/src/business/review-submission/`, and `backend/src/data/review-submission/`
- [ ] T002 Create frontend review submission module skeletons in `frontend/src/presentation/review-submission/`, `frontend/src/business/review-submission/`, and `frontend/src/data/review-submission/`
- [ ] T003 [P] Add shared test directories for UC-10 in `backend/tests/contract/review-submission/`, `backend/tests/integration/review-submission/`, and `frontend/tests/e2e/review-submission/`
- [ ] T004 [P] Add UC-10 environment/test data bootstrap entries in `infra/db/migrations/` and `infra/ops/monitoring/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement canonical submission outcome constants in `backend/src/business/review-submission/submission-outcome.ts`
- [ ] T006 [P] Implement submit-time eligibility policy service in `backend/src/business/review-submission/eligibility-policy.ts`
- [ ] T007 [P] Implement review validation policy service in `backend/src/business/review-submission/review-validation-policy.ts`
- [ ] T008 Implement repository interfaces for submission, eligibility, and audit in `backend/src/business/review-submission/ports.ts`
- [ ] T009 [P] Implement Prisma repository adapters in `backend/src/data/review-submission/review-submission.repository.ts`, `backend/src/data/review-submission/assignment-eligibility.repository.ts`, and `backend/src/data/review-submission/review-submission-audit.repository.ts`
- [ ] T010 Implement shared error mapping and explicit user-visible response formatter in `backend/src/presentation/review-submission/error-mapper.ts`
- [ ] T011 [P] Implement structured audit event emitter for submission outcomes in `backend/src/business/review-submission/audit-logger.ts`
- [ ] T012 Add route-level auth/session guard middleware wiring for UC-10 endpoints in `backend/src/security/session-guard.ts` and `backend/src/presentation/review-submission/routes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Submit Completed Review (Priority: P1) 🎯 MVP

**Goal**: Allow an eligible referee to retrieve review form data and submit one final valid review that is recorded and confirmed.

**Independent Test**: With accepted assignment and valid review payload, GET review form then POST submission and verify exactly one final review record plus success confirmation.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T013 [P] [US1] Add contract tests for `GET /api/referee/assignments/{assignmentId}/review-form` and `POST /api/referee/assignments/{assignmentId}/review-submissions` in `backend/tests/contract/review-submission/review-submission.contract.test.ts`
- [ ] T014 [P] [US1] Add integration test for successful final submission persistence in `backend/tests/integration/review-submission/review-submission-success.integration.test.ts`
- [ ] T015 [P] [US1] Add e2e test for successful referee submit flow in Chrome/Firefox in `frontend/tests/e2e/review-submission/review-submission-success.e2e.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Implement review form retrieval handler in `backend/src/presentation/review-submission/get-review-form.handler.ts`
- [ ] T017 [US1] Implement submit review handler in `backend/src/presentation/review-submission/post-review-submission.handler.ts`
- [ ] T018 [US1] Implement submit review orchestrator service in `backend/src/business/review-submission/submit-review.service.ts`
- [ ] T019 [US1] Implement one-final-submission guard logic in `backend/src/business/review-submission/final-submission-guard.ts`
- [ ] T020 [US1] Implement Prisma persistence for `ReviewSubmission` in `backend/src/data/review-submission/review-submission.prisma-repository.ts`
- [ ] T021 [US1] Implement frontend review form page and submit action in `frontend/src/presentation/review-submission/review-form-page.tsx`
- [ ] T022 [US1] Implement frontend business/use-case adapter for submit flow in `frontend/src/business/review-submission/submit-review.use-case.ts`
- [ ] T023 [US1] Implement frontend data API client for UC-10 endpoints in `frontend/src/data/review-submission/review-submission.api.ts`
- [ ] T024 [US1] Emit success audit event for accepted submission in `backend/src/business/review-submission/audit-logger.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Handle Invalid or Incomplete Review Submission (Priority: P1)

**Goal**: Reject invalid, ineligible, duplicate, unauthorized, and session-expired submission attempts with explicit canonical outcomes and allow correction/resubmit for validation failures.

**Independent Test**: Submit invalid/incomplete payload and verify field-level issues with no record creation; submit non-owned/ineligible/session-expired/duplicate scenarios and verify canonical denial outcomes with audit events.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T025 [P] [US2] Add contract tests for `validation-failed`, `session-expired`, and `submission-unavailable` outcomes in `backend/tests/contract/review-submission/review-submission-failures.contract.test.ts`
- [ ] T026 [P] [US2] Add integration tests for submit-time ineligibility, duplicate final submission, and non-owned denial in `backend/tests/integration/review-submission/review-submission-failures.integration.test.ts`
- [ ] T027 [P] [US2] Add e2e test for validation correction-and-resubmit flow in `frontend/tests/e2e/review-submission/review-submission-validation-retry.e2e.ts`

### Implementation for User Story 2

- [ ] T028 [US2] Implement field-level validation issue mapping for submission payloads in `backend/src/business/review-submission/review-validation-policy.ts`
- [ ] T029 [US2] Implement explicit canonical failure response mapping in `backend/src/presentation/review-submission/error-mapper.ts`
- [ ] T030 [US2] Implement submit-time eligibility revalidation and stale-ineligibility handling in `backend/src/business/review-submission/eligibility-policy.ts`
- [ ] T031 [US2] Implement session-expired handling for protected submit requests in `backend/src/security/session-guard.ts`
- [ ] T032 [US2] Implement non-enumerating denial behavior in submission handlers in `backend/src/presentation/review-submission/post-review-submission.handler.ts`
- [ ] T033 [US2] Implement failure audit event reasons for denied/rejected paths in `backend/src/business/review-submission/audit-logger.ts`
- [ ] T034 [US2] Implement frontend validation issue rendering and resubmit UX in `frontend/src/presentation/review-submission/review-form-page.tsx`
- [ ] T035 [US2] Implement frontend handling for `session-expired` and `submission-unavailable` outcomes in `frontend/src/business/review-submission/submit-review.use-case.ts`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T036 [P] Add concurrency integration tests for rapid repeated submissions in `backend/tests/integration/review-submission/review-submission-concurrency.integration.test.ts`
- [ ] T037 [P] Add audit-log sanitization tests ensuring no plaintext review content in logs in `backend/tests/integration/review-submission/review-submission-audit-sanitization.integration.test.ts`
- [ ] T038 [P] Add browser matrix execution for UC-10 e2e scenarios in `frontend/tests/e2e/review-submission/`
- [ ] T039 Update operational recovery notes for review submission records in `infra/ops/recovery/review-submission-recovery.md`
- [ ] T040 Update feature quick verification checklist for UC-10 outcomes in `specs/010-submit-paper-review/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP baseline
- **User Story 2 (Phase 4)**: Depends on User Story 1 endpoint/service baseline and Foundational completion
- **Hardening (Phase 5)**: Depends on completion of User Stories 1 and 2

### User Story Dependency Graph

- **US1 (P1)** → **US2 (P1)**
- Rationale: US2 extends submission failure and correction behavior on top of US1 submission and endpoint baseline.

### Within Each User Story

- Tests MUST be written first and observed failing before implementation
- Presentation/business/data layer tasks MUST remain separated
- Validation and explicit error messaging MUST be implemented before story sign-off
- RBAC and audit logging tasks MUST complete for protected submission paths
- Story must pass contract, integration, and e2e tests before moving on

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- In Phase 2, T006/T007/T009/T011 can run concurrently
- In US1, T013/T014/T015 can run concurrently before implementation tasks
- In US2, T025/T026/T027 can run concurrently before implementation tasks
- In Phase 5, T036/T037/T038 can run concurrently

---

## Parallel Example: User Story 1

```bash
# Tests first in parallel (expected to fail initially)
Task: "T013 backend/tests/contract/review-submission/review-submission.contract.test.ts"
Task: "T014 backend/tests/integration/review-submission/review-submission-success.integration.test.ts"
Task: "T015 frontend/tests/e2e/review-submission/review-submission-success.e2e.ts"

# Then implement by layer
Task: "T016 backend/src/presentation/review-submission/get-review-form.handler.ts"
Task: "T018 backend/src/business/review-submission/submit-review.service.ts"
Task: "T020 backend/src/data/review-submission/review-submission.prisma-repository.ts"
```

## Parallel Example: User Story 2

```bash
# Tests first in parallel (expected to fail initially)
Task: "T025 backend/tests/contract/review-submission/review-submission-failures.contract.test.ts"
Task: "T026 backend/tests/integration/review-submission/review-submission-failures.integration.test.ts"
Task: "T027 frontend/tests/e2e/review-submission/review-submission-validation-retry.e2e.ts"

# Then implement failure handling paths
Task: "T029 backend/src/presentation/review-submission/error-mapper.ts"
Task: "T030 backend/src/business/review-submission/eligibility-policy.ts"
Task: "T034 frontend/src/presentation/review-submission/review-form-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate AT-UC10-01 path through contract, integration, and e2e tests
5. Demo MVP for eligible single final submission flow

### Incremental Delivery

1. Deliver Setup + Foundational
2. Deliver US1 (successful submission)
3. Deliver US2 (invalid/ineligible/expired-session/duplicate handling)
4. Execute Phase 5 hardening for concurrency, audit sanitization, browser coverage, and recovery notes

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational completion:
   - Developer A: US1 backend presentation/business/data tasks
   - Developer B: US1 frontend tasks then US2 frontend failure handling tasks
   - Developer C: Contract/integration/e2e test tracks and hardening tests
3. Merge only when each story independently passes required tests and canonical outcome checks

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] labels map tasks to user stories for traceability
- Every story remains independently completable and testable
- Reliability, confidentiality, and explicit error communication take priority over optimization
