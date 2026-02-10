# Tasks: Author Receive Decision

**Input**: Design documents from `/specs/013-author-receive-decision/`
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

**Purpose**: Initialize project scaffolding and quality tooling for UC-13

- [ ] T001 Create backend feature module skeletons in `backend/src/presentation/author-decision/`, `backend/src/business/author-decision/`, and `backend/src/data/author-decision/`
- [ ] T002 Create frontend feature module skeletons in `frontend/src/presentation/author-decision/`, `frontend/src/business/author-decision/`, and `frontend/src/data/author-decision/`
- [ ] T003 [P] Add test directories for UC-13 in `backend/tests/contract/author-decision/`, `backend/tests/integration/author-decision/`, and `frontend/tests/e2e/author-decision/`
- [ ] T004 [P] Add fixture setup entries for author, decision, and notification states in `infra/db/migrations/` and `infra/ops/monitoring/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement canonical outcome constants for author decision access in `backend/src/business/author-decision/decision-outcome.ts`
- [ ] T006 [P] Implement author ownership verifier in `backend/src/business/author-decision/ownership-check.ts`
- [ ] T007 [P] Implement notification status reader in `backend/src/business/author-decision/notification-status.ts`
- [ ] T008 Implement repository interfaces for author decision access in `backend/src/business/author-decision/ports.ts`
- [ ] T009 [P] Implement data repositories for decision access and notification status in `backend/src/data/author-decision/author-decision.repository.ts`
- [ ] T010 Implement shared error mapping and response formatter in `backend/src/presentation/author-decision/error-mapper.ts`
- [ ] T011 [P] Implement audit event emitter for decision access in `backend/src/business/author-decision/audit-logger.ts`
- [ ] T012 Add author RBAC and session guard wiring for UC-13 endpoint in `backend/src/security/session-guard.ts` and `backend/src/presentation/author-decision/routes.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Receive Decision (Priority: P1) 🎯 MVP

**Goal**: Notify authors when a decision is available and allow them to view accept/reject outcomes.

**Independent Test**: With a recorded decision and a notified author, verify the author can access and view the decision outcome.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T013 [P] [US1] Add contract tests for `GET /api/author/papers/{paperId}/decision` success response in `backend/tests/contract/author-decision/author-decision.contract.test.ts`
- [ ] T014 [P] [US1] Add integration test for decision access and ownership enforcement in `backend/tests/integration/author-decision/author-decision-success.integration.test.ts`
- [ ] T015 [P] [US1] Add e2e test for author decision view in `frontend/tests/e2e/author-decision/author-decision-success.e2e.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Implement author decision handler in `backend/src/presentation/author-decision/get-author-decision.handler.ts`
- [ ] T017 [US1] Implement decision access service in `backend/src/business/author-decision/get-author-decision.service.ts`
- [ ] T018 [US1] Implement decision access query in `backend/src/data/author-decision/author-decision.repository.ts`
- [ ] T019 [US1] Implement author decision page in `frontend/src/presentation/author-decision/author-decision-page.tsx`
- [ ] T020 [US1] Implement frontend use-case adapter for author decision access in `frontend/src/business/author-decision/get-author-decision.use-case.ts`
- [ ] T021 [US1] Implement frontend API client for UC-13 endpoint in `frontend/src/data/author-decision/author-decision.api.ts`
- [ ] T022 [US1] Emit success audit event for decision access in `backend/src/business/author-decision/audit-logger.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Notification Not Delivered (Priority: P1)

**Goal**: When notification delivery fails, show a banner and prevent decision access while preserving auditability.

**Independent Test**: With a failed notification delivery, verify the banner displays and no decision access occurs.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T023 [P] [US2] Add contract tests for notification failed outcome in `backend/tests/contract/author-decision/author-decision-notification-failed.contract.test.ts`
- [ ] T024 [P] [US2] Add integration tests for notification-failure banner behavior in `backend/tests/integration/author-decision/author-decision-notification-failed.integration.test.ts`
- [ ] T025 [P] [US2] Add e2e test for notification-failed banner in `frontend/tests/e2e/author-decision/author-decision-notification-failed.e2e.ts`

### Implementation for User Story 2

- [ ] T026 [US2] Wire notification-failure handling in `backend/src/business/author-decision/get-author-decision.service.ts`
- [ ] T027 [US2] Implement notification-failed outcome mapping in `backend/src/presentation/author-decision/error-mapper.ts`
- [ ] T028 [US2] Implement generic unavailable/denied handling for non-owner access in `backend/src/presentation/author-decision/get-author-decision.handler.ts`
- [ ] T029 [US2] Implement frontend notification-failed banner in `frontend/src/presentation/author-decision/author-decision-page.tsx`
- [ ] T030 [US2] Implement frontend handling for `NOTIFICATION_FAILED` and `UNAVAILABLE_DENIED` outcomes in `frontend/src/business/author-decision/get-author-decision.use-case.ts`
- [ ] T031 [US2] Emit notification-failed audit events in `backend/src/business/author-decision/audit-logger.ts`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T032 [P] Add concurrency integration tests for simultaneous decision access in `backend/tests/integration/author-decision/author-decision-concurrency.integration.test.ts`
- [ ] T033 [P] Add audit-log sanitization tests (no sensitive leakage) in `backend/tests/integration/author-decision/author-decision-audit-sanitization.integration.test.ts`
- [ ] T034 [P] Add browser matrix execution for UC-13 e2e scenarios in `frontend/tests/e2e/author-decision/`
- [ ] T035 Update recovery notes for decision notification/access data paths in `infra/ops/recovery/author-decision-recovery.md`
- [ ] T036 Update quickstart verification checklist in `specs/013-author-receive-decision/quickstart.md`
- [ ] T037 [P] Add TLS enforcement verification test for UC-13 endpoint in `backend/tests/integration/author-decision/author-decision-tls.integration.test.ts`
- [ ] T038 Add encryption-at-rest verification checklist for decision data in `infra/ops/recovery/author-decision-recovery.md`
- [ ] T039 Add library-first justification note for UC-13 dependencies in `specs/013-author-receive-decision/plan.md`
- [ ] T040 Add recovery verification checklist steps for decision data paths in `infra/ops/recovery/author-decision-recovery.md`

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
- Rationale: US2 extends notification-failure behavior on top of the core decision access flow.

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
Task: "T013 backend/tests/contract/author-decision/author-decision.contract.test.ts"
Task: "T014 backend/tests/integration/author-decision/author-decision-success.integration.test.ts"
Task: "T015 frontend/tests/e2e/author-decision/author-decision-success.e2e.ts"

# Then implement by layer
Task: "T016 backend/src/presentation/author-decision/get-author-decision.handler.ts"
Task: "T017 backend/src/business/author-decision/get-author-decision.service.ts"
Task: "T018 backend/src/data/author-decision/author-decision.repository.ts"
```

## Parallel Example: User Story 2

```bash
# Tests first in parallel (expected to fail initially)
Task: "T023 backend/tests/contract/author-decision/author-decision-notification-failed.contract.test.ts"
Task: "T024 backend/tests/integration/author-decision/author-decision-notification-failed.integration.test.ts"
Task: "T025 frontend/tests/e2e/author-decision/author-decision-notification-failed.e2e.ts"

# Then implement notification-failed handling
Task: "T027 backend/src/presentation/author-decision/error-mapper.ts"
Task: "T028 backend/src/presentation/author-decision/get-author-decision.handler.ts"
Task: "T029 frontend/src/presentation/author-decision/author-decision-page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate AT-UC13-01 path through contract, integration, and e2e tests
5. Demo MVP for author decision access

### Incremental Delivery

1. Deliver Setup + Foundational
2. Deliver US1 (author receives decision)
3. Deliver US2 (notification failure handling)
4. Execute Phase 5 hardening for concurrency, audit sanitization, browser coverage, and recovery notes

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Foundational completion:
   - Developer A: US1 backend presentation/business/data tasks
   - Developer B: US1 frontend tasks then US2 frontend notification-failed banner tasks
   - Developer C: Contract/integration/e2e test tracks and hardening tests
3. Merge only when each story independently passes required tests and decision outcome checks

---

## Notes

- [P] tasks = different files, no dependencies
- [US1]/[US2] labels map tasks to user stories for traceability
- Every story remains independently completable and testable
- Reliability, confidentiality, and explicit error communication take priority over optimization
