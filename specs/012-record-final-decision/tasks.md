# Tasks: Record Final Decision

**Input**: Design documents from `/specs/012-record-final-decision/`
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

**Purpose**: Initialize project scaffolding and quality tooling for UC-12

- [ ] T001 Create backend feature module skeletons in `backend/src/presentation/final-decision/`, `backend/src/business/final-decision/`, and `backend/src/data/final-decision/`
- [ ] T002 Create frontend feature module skeletons in `frontend/src/presentation/final-decision/`, `frontend/src/business/final-decision/`, and `frontend/src/data/final-decision/`
- [ ] T003 [P] Add test directories for UC-12 in `backend/tests/contract/final-decision/`, `backend/tests/integration/final-decision/`, and `frontend/tests/e2e/final-decision/`
- [ ] T004 [P] Add fixture setup entries for editor, decisions, and review states in `infra/db/migrations/` and `infra/ops/monitoring/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement canonical outcome constants for decision recording in `backend/src/business/final-decision/decision-outcome.ts`
- [ ] T006 [P] Implement review completion gate in `backend/src/business/final-decision/completion-gate.ts`
- [ ] T007 [P] Implement immutability guard for final decisions in `backend/src/business/final-decision/immutability-guard.ts`
- [ ] T008 Implement repository interfaces for decision recording in `backend/src/business/final-decision/ports.ts`
- [ ] T009 [P] Implement data repositories for decisions and completion status in `backend/src/data/final-decision/final-decision.repository.ts`
- [ ] T010 Implement shared error mapping and response formatter in `backend/src/presentation/final-decision/error-mapper.ts`
- [ ] T011 [P] Implement audit event emitter for decision recording in `backend/src/business/final-decision/audit-logger.ts`
- [ ] T012 Add editor RBAC and session guard wiring for UC-12 endpoint in `backend/src/security/session-guard.ts` and `backend/src/presentation/final-decision/routes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Record Final Decision (Priority: P1) 🎯 MVP

**Goal**: Allow eligible editors to record a final accept/reject decision after reviews are complete and notify the author.

**Independent Test**: With completed reviews for a paper and an editor session, record a decision and verify persistence and author notification.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T013 [P] [US1] Add contract tests for `POST /api/editor/papers/{paperId}/decision` success response in `backend/tests/contract/final-decision/final-decision.contract.test.ts`
- [ ] T014 [P] [US1] Add integration test for decision persistence and notification in `backend/tests/integration/final-decision/final-decision-success.integration.test.ts`
- [ ] T015 [P] [US1] Add e2e test for editor final decision workflow in `frontend/tests/e2e/final-decision/final-decision-success.e2e.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Implement decision recording handler in `backend/src/presentation/final-decision/post-final-decision.handler.ts`
- [ ] T017 [US1] Implement decision orchestration service in `backend/src/business/final-decision/post-final-decision.service.ts`
- [ ] T018 [US1] Implement decision write/query in `backend/src/data/final-decision/final-decision.repository.ts`
- [ ] T019 [US1] Implement frontend decision entry page in `frontend/src/presentation/final-decision/final-decision-page.tsx`
- [ ] T020 [US1] Implement frontend use-case adapter for decision recording in `frontend/src/business/final-decision/post-final-decision.use-case.ts`
- [ ] T021 [US1] Implement frontend API client for UC-12 endpoint in `frontend/src/data/final-decision/final-decision.api.ts`
- [ ] T022 [US1] Emit success audit event for decision recording in `backend/src/business/final-decision/audit-logger.ts`
- [ ] T023 [US1] Implement author notification dispatch in `backend/src/business/final-decision/author-notifier.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Block Decision Until Reviews Complete (Priority: P1)

**Goal**: When required reviews are pending, block decision recording with explicit feedback, no review content, and no decision persistence.

**Independent Test**: With pending reviews for a paper, attempt to record a decision and verify the block with no decision recorded and no author notification.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T024 [P] [US2] Add contract tests for pending and finalized outcomes in `backend/tests/contract/final-decision/final-decision-pending-finalized.contract.test.ts`
- [ ] T025 [P] [US2] Add integration tests for pending gating and immutability in `backend/tests/integration/final-decision/final-decision-pending-finalized.integration.test.ts`
- [ ] T026 [P] [US2] Add e2e test for pending-review decision block in `frontend/tests/e2e/final-decision/final-decision-pending.e2e.ts`

### Implementation for User Story 2

- [ ] T027 [US2] Wire completion gating usage in `backend/src/business/final-decision/post-final-decision.service.ts`
- [ ] T028 [US2] Implement pending/finalized outcome mapping in `backend/src/presentation/final-decision/error-mapper.ts`
- [ ] T029 [US2] Implement generic unavailable/denied handling for non-editor access in `backend/src/presentation/final-decision/post-final-decision.handler.ts`
- [ ] T030 [US2] Implement frontend pending state UI in `frontend/src/presentation/final-decision/final-decision-page.tsx`
- [ ] T031 [US2] Implement frontend handling for `REVIEWS_PENDING` and `DECISION_FINALIZED` outcomes in `frontend/src/business/final-decision/post-final-decision.use-case.ts`
- [ ] T032 [US2] Emit blocked/denied audit events in `backend/src/business/final-decision/audit-logger.ts`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T033 [P] Add concurrency integration tests for simultaneous decision attempts in `backend/tests/integration/final-decision/final-decision-concurrency.integration.test.ts`
- [ ] T034 [P] Add audit-log sanitization tests (no sensitive leakage) in `backend/tests/integration/final-decision/final-decision-audit-sanitization.integration.test.ts`
- [ ] T035 [P] Add browser matrix execution for UC-12 e2e scenarios in `frontend/tests/e2e/final-decision/`
- [ ] T036 Update recovery notes for decision data paths in `infra/ops/recovery/final-decision-recovery.md`
- [ ] T037 Update quickstart verification checklist in `specs/012-record-final-decision/quickstart.md`
- [ ] T038 [P] Add TLS enforcement verification test for UC-12 endpoint in `backend/tests/integration/final-decision/final-decision-tls.integration.test.ts`
- [ ] T039 Add encryption-at-rest verification checklist for decision data in `infra/ops/recovery/final-decision-recovery.md`
- [ ] T040 Add library-first justification note for UC-12 dependencies in `specs/012-record-final-decision/plan.md`
- [ ] T041 Add recovery verification checklist steps for decision data paths in `infra/ops/recovery/final-decision-recovery.md`

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
- Rationale: US2 extends decision blocking/immutability behavior on top of the core decision endpoint.

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
- In US2, T024/T025/T026 can run concurrently before implementation tasks
- In Phase 5, T033/T034/T035 can run concurrently

---

## Parallel Example: User Story 1

```bash
# Tests first in parallel (expected to fail initially)
Task: "T013 backend/tests/contract/final-decision/final-decision.contract.test.ts"
Task: "T014 backend/tests/integration/final-decision/final-decision-success.integration.test.ts"
Task: "T015 frontend/tests/e2e/final-decision/final-decision-success.e2e.ts"

# Then implement by layer
Task: "T016 backend/src/presentation/final-decision/post-final-decision.handler.ts"
Task: "T017 backend/src/business/final-decision/post-final-decision.service.ts"
Task: "T018 backend/src/data/final-decision/final-decision.repository.ts"
```

## Parallel Example: User Story 2

```bash
# Tests first in parallel (expected to fail initially)
Task: "T024 backend/tests/contract/final-decision/final-decision-pending-finalized.contract.test.ts"
Task: "T025 backend/tests/integration/final-decision/final-decision-pending-finalized.integration.test.ts"
Task: "T026 frontend/tests/e2e/final-decision/final-decision-pending.e2e.ts"

# Then implement pending/finalized handling
Task: "T028 backend/src/presentation/final-decision/error-mapper.ts"
Task: "T029 backend/src/presentation/final-decision/post-final-decision.handler.ts"
Task: "T030 frontend/src/presentation/final-decision/final-decision-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate AT-UC12-01 path through contract, integration, and e2e tests
5. Demo MVP for final decision recording

### Incremental Delivery

1. Deliver Setup + Foundational
2. Deliver US1 (record final decision)
3. Deliver US2 (pending/immutable handling)
4. Execute Phase 5 hardening for concurrency, audit sanitization, browser coverage, and recovery notes

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational completion:
   - Developer A: US1 backend presentation/business/data tasks
   - Developer B: US1 frontend tasks then US2 frontend pending handling tasks
   - Developer C: Contract/integration/e2e test tracks and hardening tests
3. Merge only when each story independently passes required tests and decision outcome checks

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] labels map tasks to user stories for traceability
- Every story remains independently completable and testable
- Reliability, confidentiality, and explicit error communication take priority over optimization
