# Tasks: View Completed Paper Reviews

**Input**: Design documents from `/specs/011-view-completed-reviews/`
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

**Purpose**: Initialize project scaffolding and quality tooling for UC-11

- [ ] T001 Create backend feature module skeletons in `backend/src/presentation/review-visibility/`, `backend/src/business/review-visibility/`, and `backend/src/data/review-visibility/`
- [ ] T002 Create frontend feature module skeletons in `frontend/src/presentation/review-visibility/`, `frontend/src/business/review-visibility/`, and `frontend/src/data/review-visibility/`
- [ ] T003 [P] Add test directories for UC-11 in `backend/tests/contract/review-visibility/`, `backend/tests/integration/review-visibility/`, and `frontend/tests/e2e/review-visibility/`
- [ ] T004 [P] Add fixture setup entries for editor and review states in `infra/db/migrations/` and `infra/ops/monitoring/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement canonical outcome constants for review visibility in `backend/src/business/review-visibility/visibility-outcome.ts`
- [ ] T006 [P] Implement review completion gating service in `backend/src/business/review-visibility/completion-gate.ts`
- [ ] T007 [P] Implement anonymization mapper for review entries in `backend/src/business/review-visibility/anonymizer.ts`
- [ ] T008 Implement repository interfaces for review visibility in `backend/src/business/review-visibility/ports.ts`
- [ ] T009 [P] Implement data repositories for completion status and reviews in `backend/src/data/review-visibility/review-visibility.repository.ts`
- [ ] T010 Implement shared error mapping and response formatter in `backend/src/presentation/review-visibility/error-mapper.ts`
- [ ] T011 [P] Implement audit event emitter for visibility requests in `backend/src/business/review-visibility/audit-logger.ts`
- [ ] T012 Add editor RBAC and session guard wiring for UC-11 endpoint in `backend/src/security/session-guard.ts` and `backend/src/presentation/review-visibility/routes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Completed Reviews (Priority: P1) 🎯 MVP

**Goal**: Allow eligible editors to retrieve and read all completed reviews once required reviews are complete.

**Independent Test**: With completed reviews for a paper and an editor session, request reviews and verify the anonymized completed review set is returned.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T013 [P] [US1] Add contract tests for `GET /api/editor/papers/{paperId}/reviews` success response in `backend/tests/contract/review-visibility/review-visibility.contract.test.ts`
- [ ] T014 [P] [US1] Add integration test for completed-review retrieval and anonymization in `backend/tests/integration/review-visibility/review-visibility-success.integration.test.ts`
- [ ] T015 [P] [US1] Add e2e test for editor completed review visibility in `frontend/tests/e2e/review-visibility/review-visibility-success.e2e.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Implement review visibility handler in `backend/src/presentation/review-visibility/get-completed-reviews.handler.ts`
- [ ] T017 [US1] Implement visibility orchestration service in `backend/src/business/review-visibility/get-completed-reviews.service.ts`
- [ ] T018 [US1] Implement anonymized review query in `backend/src/data/review-visibility/review-visibility.repository.ts`
- [ ] T019 [US1] Implement frontend review visibility page in `frontend/src/presentation/review-visibility/review-visibility-page.tsx`
- [ ] T020 [US1] Implement frontend use-case adapter for completed reviews in `frontend/src/business/review-visibility/get-completed-reviews.use-case.ts`
- [ ] T021 [US1] Implement frontend API client for UC-11 endpoint in `frontend/src/data/review-visibility/review-visibility.api.ts`
- [ ] T022 [US1] Emit success audit event for visibility request in `backend/src/business/review-visibility/audit-logger.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Handle Pending Reviews (Priority: P1)

**Goal**: When required reviews are pending, return a pending outcome with no review content and prevent decision workflows based on incomplete data.

**Independent Test**: With pending reviews for a paper, request reviews and verify a pending response with no review content; non-editor access returns generic unavailable/denied.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T023 [P] [US2] Add contract tests for pending and denied outcomes in `backend/tests/contract/review-visibility/review-visibility-pending-denied.contract.test.ts`
- [ ] T024 [P] [US2] Add integration tests for pending gating and generic denial in `backend/tests/integration/review-visibility/review-visibility-pending-denied.integration.test.ts`
- [ ] T025 [P] [US2] Add e2e test for pending-review message and no content in `frontend/tests/e2e/review-visibility/review-visibility-pending.e2e.ts`

### Implementation for User Story 2

- [ ] T026 [US2] Wire completion gating usage in `backend/src/business/review-visibility/get-completed-reviews.service.ts`
- [ ] T027 [US2] Implement pending outcome mapping in `backend/src/presentation/review-visibility/error-mapper.ts`
- [ ] T028 [US2] Implement generic unavailable/denied handling for non-editor access in `backend/src/presentation/review-visibility/get-completed-reviews.handler.ts`
- [ ] T029 [US2] Implement frontend pending state UI in `frontend/src/presentation/review-visibility/review-visibility-page.tsx`
- [ ] T030 [US2] Implement frontend handling for `REVIEWS_PENDING` and `UNAVAILABLE_DENIED` outcomes in `frontend/src/business/review-visibility/get-completed-reviews.use-case.ts`
- [ ] T031 [US2] Emit pending/denied audit events in `backend/src/business/review-visibility/audit-logger.ts`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T032 [P] Add concurrency integration tests for simultaneous editor requests in `backend/tests/integration/review-visibility/review-visibility-concurrency.integration.test.ts`
- [ ] T033 [P] Add audit-log sanitization tests (no referee identity leakage) in `backend/tests/integration/review-visibility/review-visibility-audit-sanitization.integration.test.ts`
- [ ] T034 [P] Add browser matrix execution for UC-11 e2e scenarios in `frontend/tests/e2e/review-visibility/`
- [ ] T035 Update recovery notes for review visibility data paths in `infra/ops/recovery/review-visibility-recovery.md`
- [ ] T036 Update quickstart verification checklist in `specs/011-view-completed-reviews/quickstart.md`
- [ ] T037 [P] Add TLS enforcement verification test for UC-11 endpoint in `backend/tests/integration/review-visibility/review-visibility-tls.integration.test.ts`
- [ ] T038 Add encryption-at-rest verification checklist for review data in `infra/ops/recovery/review-visibility-recovery.md`
- [ ] T039 Add library-first justification note for UC-11 dependencies in `specs/011-view-completed-reviews/plan.md`
- [ ] T040 Add recovery verification checklist steps for review visibility data paths in `infra/ops/recovery/review-visibility-recovery.md`

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
- Rationale: US2 extends visibility failure/pending behavior on top of US1 endpoint and core retrieval flow.

### Within Each User Story

- Tests MUST be written first and observed failing before implementation
- Presentation/business/data layer tasks MUST remain separated
- Validation and explicit error messaging MUST be implemented before story sign-off
- RBAC and audit logging tasks MUST complete for protected access paths
- Story must pass contract, integration, and e2e tests before moving on

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- In Phase 2, T006/T007/T009/T011 can run concurrently
- In US1, T013/T014/T015 can run concurrently before implementation tasks
- In US2, T023/T024/T025 can run concurrently before implementation tasks
- In Phase 5, T032/T033/T034 can run concurrently

---

## Parallel Example: User Story 1

```bash
# Tests first in parallel (expected to fail initially)
Task: "T013 backend/tests/contract/review-visibility/review-visibility.contract.test.ts"
Task: "T014 backend/tests/integration/review-visibility/review-visibility-success.integration.test.ts"
Task: "T015 frontend/tests/e2e/review-visibility/review-visibility-success.e2e.ts"

# Then implement by layer
Task: "T016 backend/src/presentation/review-visibility/get-completed-reviews.handler.ts"
Task: "T017 backend/src/business/review-visibility/get-completed-reviews.service.ts"
Task: "T018 backend/src/data/review-visibility/review-visibility.repository.ts"
```

## Parallel Example: User Story 2

```bash
# Tests first in parallel (expected to fail initially)
Task: "T023 backend/tests/contract/review-visibility/review-visibility-pending-denied.contract.test.ts"
Task: "T024 backend/tests/integration/review-visibility/review-visibility-pending-denied.integration.test.ts"
Task: "T025 frontend/tests/e2e/review-visibility/review-visibility-pending.e2e.ts"

# Then implement pending/denied handling
Task: "T027 backend/src/presentation/review-visibility/error-mapper.ts"
Task: "T028 backend/src/presentation/review-visibility/get-completed-reviews.handler.ts"
Task: "T029 frontend/src/presentation/review-visibility/review-visibility-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate AT-UC11-01 path through contract, integration, and e2e tests
5. Demo MVP for completed review visibility

### Incremental Delivery

1. Deliver Setup + Foundational
2. Deliver US1 (completed review visibility)
3. Deliver US2 (pending/denied handling)
4. Execute Phase 5 hardening for concurrency, audit sanitization, browser coverage, and recovery notes

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational completion:
   - Developer A: US1 backend presentation/business/data tasks
   - Developer B: US1 frontend tasks then US2 frontend pending handling tasks
   - Developer C: Contract/integration/e2e test tracks and hardening tests
3. Merge only when each story independently passes required tests and visibility outcome checks

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] labels map tasks to user stories for traceability
- Every story remains independently completable and testable
- Reliability, confidentiality, and explicit error communication take priority over optimization
