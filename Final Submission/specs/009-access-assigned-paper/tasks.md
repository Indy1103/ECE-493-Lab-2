# Tasks: Access Assigned Paper for Review

**Input**: Design documents from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/`
**Prerequisites**: `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/plan.md`, `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/spec.md`, `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/research.md`, `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/data-model.md`, `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/009-access-assigned-paper/contracts/assigned-paper-access.openapi.yaml`

**Tests**: Tests are required by the active template and plan; write tests first and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story so each story remains independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and quality tooling.

- [ ] T001 Create feature module folders in `backend/src/presentation/referee-access/`, `backend/src/business/referee-access/`, and `backend/src/data/referee-access/`
- [ ] T002 Create frontend feature folders in `frontend/src/presentation/referee-access/`, `frontend/src/business/referee-access/`, and `frontend/src/data/referee-access/`
- [ ] T003 [P] Add feature test suites placeholders in `backend/tests/contract/referee-access/`, `backend/tests/integration/referee-access/`, and `frontend/tests/e2e/referee-access/`
- [ ] T004 [P] Add UC-09 fixture seed scaffolding in `infra/db/seeds/uc09-assigned-paper-seed.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared prerequisites required by all user stories.

**⚠️ CRITICAL**: No user-story implementation starts until this phase is complete.

- [ ] T005 Implement shared referee session guard middleware in `backend/src/security/sessionGuard.ts`
- [ ] T006 Implement canonical access outcome constants (`UNAVAILABLE`, `UNAVAILABLE_OR_NOT_FOUND`, `SESSION_EXPIRED`) in `backend/src/shared/accessOutcomes.ts`
- [ ] T007 [P] Implement assignment ownership + accepted-invitation validator in `backend/src/business/referee-access/assignmentAuthorization.ts`
- [ ] T008 [P] Implement assigned-paper audit event writer in `backend/src/data/referee-access/assignedPaperAuditRepository.ts`
- [ ] T009 Implement base Prisma repositories for `RefereeAssignment`, `PaperAccessResource`, and `ReviewFormAccess` in `backend/src/data/referee-access/assignedPaperRepository.ts`
- [ ] T010 [P] Implement frontend API client for UC-09 endpoints in `frontend/src/data/referee-access/assignedPaperApiClient.ts`
- [ ] T011 Implement shared error mapping for session-expired and unavailable outcomes in `frontend/src/business/referee-access/accessErrorMapper.ts`

**Checkpoint**: Foundation complete; user stories can proceed.

---

## Phase 3: User Story 1 - Access Assigned Paper (Priority: P1) 🎯 MVP

**Goal**: A logged-in referee can view assigned papers and access one available paper with its review form.

**Independent Test**: With a logged-in referee who has at least one active accepted assignment, list assignments and access one assignment; paper and review form are returned.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add contract tests for `GET /api/referee/assignments` and `POST /api/referee/assignments/{assignmentId}/access` success path in `backend/tests/contract/referee-access/assignedPaperAccess.contract.test.ts`
- [ ] T013 [P] [US1] Add backend integration tests for assignment list + successful access in `backend/tests/integration/referee-access/assignedPaperAccess.integration.test.ts`
- [ ] T014 [P] [US1] Add frontend e2e success-flow test for AT-UC09-01 in `frontend/tests/e2e/referee-access/assigned-paper-success.e2e.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Implement list-assignments route handler in `backend/src/presentation/referee-access/getAssignmentsRoute.ts`
- [ ] T016 [US1] Implement selected-assignment access route handler in `backend/src/presentation/referee-access/postAssignmentAccessRoute.ts`
- [ ] T017 [US1] Implement business workflow for assignment list retrieval in `backend/src/business/referee-access/listAssignmentsService.ts`
- [ ] T018 [US1] Implement business workflow for atomic paper+review-form access in `backend/src/business/referee-access/accessAssignedPaperService.ts`
- [ ] T019 [US1] Implement assigned papers list + access UI flow in `frontend/src/presentation/referee-access/AssignedPapersPage.tsx`
- [ ] T020 [US1] Implement frontend orchestration service for list/select actions in `frontend/src/business/referee-access/assignedPaperAccessController.ts`

**Checkpoint**: US1 delivers UC-09 primary success path independently.

---

## Phase 4: User Story 2 - Handle No Assigned Papers (Priority: P1)

**Goal**: A logged-in referee with no assignments receives an explicit no-assignment outcome and no accessible paper/form.

**Independent Test**: With a logged-in referee with zero active accepted assignments, list assignments and confirm explicit no-assigned-papers outcome with no access action available.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add contract test for no-assignment list response (`messageCode=NO_ASSIGNMENTS`) in `backend/tests/contract/referee-access/noAssignments.contract.test.ts`
- [ ] T022 [P] [US2] Add backend integration test for UC-09 extension 2a in `backend/tests/integration/referee-access/noAssignments.integration.test.ts`
- [ ] T023 [P] [US2] Add frontend e2e test for AT-UC09-02 empty-state messaging in `frontend/tests/e2e/referee-access/no-assignments.e2e.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Implement no-assignment branch in assignment listing service in `backend/src/business/referee-access/listAssignmentsService.ts`
- [ ] T025 [US2] Implement no-assignment response mapping in `backend/src/presentation/referee-access/getAssignmentsRoute.ts`
- [ ] T026 [US2] Implement explicit empty-state UI messaging in `frontend/src/presentation/referee-access/AssignedPapersEmptyState.tsx`
- [ ] T027 [US2] Emit auditable NO_ASSIGNMENTS event in `backend/src/data/referee-access/assignedPaperAuditRepository.ts`

**Checkpoint**: US2 is independently testable with explicit no-assignment behavior.

---

## Phase 5: User Story 3 - Handle Unavailable Assigned Paper (Priority: P2)

**Goal**: A logged-in referee is explicitly informed when a selected assigned paper is unavailable, and access is denied.

**Independent Test**: With an assignment that is no longer available (or form unavailable), select the assignment and verify `UNAVAILABLE` outcome with no paper/form returned.

### Tests for User Story 3

- [ ] T028 [P] [US3] Add contract tests for unavailable/not-found/session-expired access outcomes in `backend/tests/contract/referee-access/unavailableAccess.contract.test.ts`
- [ ] T029 [P] [US3] Add backend integration tests for availability revalidation and atomic form-failure denial in `backend/tests/integration/referee-access/unavailableAccess.integration.test.ts`
- [ ] T030 [P] [US3] Add frontend e2e tests for AT-UC09-03 and session-expired message handling in `frontend/tests/e2e/referee-access/unavailable-or-expired.e2e.ts`

### Implementation for User Story 3

- [ ] T031 [US3] Implement availability revalidation + stale assignment handling in `backend/src/business/referee-access/accessAssignedPaperService.ts`
- [ ] T032 [US3] Implement generic non-enumerating direct-access denial mapping in `backend/src/presentation/referee-access/postAssignmentAccessRoute.ts`
- [ ] T033 [US3] Implement session-expired (`401` + `SESSION_EXPIRED`) handling in `backend/src/presentation/referee-access/refereeAccessErrorHandler.ts`
- [ ] T034 [US3] Implement unavailable/session-expired user-visible outcomes in `frontend/src/presentation/referee-access/AssignedPaperAccessAlert.tsx`
- [ ] T035 [US3] Emit UNAVAILABLE/UNAVAILABLE_OR_NOT_FOUND/SESSION_EXPIRED audit outcomes in `backend/src/data/referee-access/assignedPaperAuditRepository.ts`

**Checkpoint**: US3 independently delivers unavailable-paper alternative flow and protected failure outcomes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate cross-story quality constraints and operational readiness.

- [ ] T036 [P] Run full backend test matrix (unit/integration/contract) for UC-09 in `backend/tests/`
- [ ] T037 [P] Run frontend integration/e2e matrix for Chrome + Firefox for UC-09 in `frontend/tests/e2e/referee-access/`
- [ ] T038 [P] Validate no sensitive data leakage in access logs and error payloads in `backend/src/security/` and `backend/src/shared/`
- [ ] T039 Update UC-09 operational notes for backup/restore and audit observability in `specs/009-access-assigned-paper/quickstart.md`
- [ ] T040 Implement and verify TLS-only enforcement for UC-09 endpoints in `backend/src/presentation/referee-access/` and `backend/src/security/transportPolicy.ts`
- [ ] T041 [P] Add integration test asserting non-TLS requests are rejected for UC-09 routes in `backend/tests/integration/referee-access/transportSecurity.integration.test.ts`
- [ ] T042 [P] Validate encrypted-at-rest handling for assignment/review-access linkage data and backups in `infra/db/` and `backend/src/data/referee-access/`
- [ ] T043 [P] Add data-layer verification test for protected sensitive linkage fields in `backend/tests/integration/referee-access/dataProtection.integration.test.ts`
- [ ] T044 [P] Add performance test for UC-09 access path (95th percentile <= 5s) in `backend/tests/integration/referee-access/performance.integration.test.ts`
- [ ] T045 Record SC-001 measurement evidence and threshold result in `specs/009-access-assigned-paper/quickstart.md`

---

## Dependencies & Execution Order

### Story Completion Order

- Foundational phase is required before all user stories.
- **US1 (P1)** and **US2 (P1)** can start after Foundational; implement US1 first for MVP, then US2.
- **US3 (P2)** depends on the US1 access path and can start after US1 is stable.
- Polish phase depends on completed stories.

### Dependency Graph

- Setup -> Foundational -> US1 -> US3 -> Polish
- Setup -> Foundational -> US2 -> Polish

---

## Parallel Execution Examples

### User Story 1

- [P] T012, T013, and T014 can run in parallel (different test files).
- [P] After T015/T016 route stubs exist, T019 and T020 can proceed in parallel with backend service tasks T017/T018.

### User Story 2

- [P] T021, T022, and T023 can run in parallel.
- [P] T026 (frontend empty state) can run in parallel with backend tasks T024/T025.

### User Story 3

- [P] T028, T029, and T030 can run in parallel.
- [P] T034 (frontend alerts) can run in parallel with backend outcome mapping tasks T031/T032/T033 once contract outcomes are fixed.

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup and Foundational phases.
2. Deliver US1 end-to-end (tests first, then implementation).
3. Validate AT-UC09-01 and security/audit behavior for success flow.

### Incremental Delivery

1. Deliver US2 as the next P1 increment (explicit empty-state behavior).
2. Deliver US3 as P2 (unavailable/denial/session-expired robustness).
3. Execute Polish phase before release.

### Validation of Completeness

- Every user story phase includes independent test criteria, tests, and implementation tasks.
- Every task follows required checklist format (`- [ ] T### [P?] [US?] ...path`).
- Contracts and entities are mapped into story tasks:
  - `GET /api/referee/assignments` -> US1/US2
  - `POST /api/referee/assignments/{assignmentId}/access` -> US1/US3
  - `RefereeAssignment`, `PaperAccessResource`, `ReviewFormAccess`, `AssignedPaperAccessAuditEvent` -> US1/US3 (with no-assignment audit in US2)
