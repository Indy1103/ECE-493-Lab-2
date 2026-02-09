---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. For every user story, write tests first and verify they fail
before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `infra/`
- **Backend layers**: `presentation/`, `business/`, `data/`
- **Frontend layers**: `presentation/`, `business/`, `data/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with priorities P1, P2, P3...)
  - Constitution-aligned constraints from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Every user story MUST include:
  - Tests written first (failing before implementation)
  - Explicit layer-separated implementation tasks
  - Validation and user-visible error handling tasks
  - RBAC/security tasks when privileged or sensitive operations are involved
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project scaffolding and quality tooling

- [ ] T001 Create backend/frontend/infra directory structure with layer folders
- [ ] T002 Initialize TypeScript projects and shared lint/format configuration
- [ ] T003 [P] Configure unit, integration, contract, and e2e test runners
- [ ] T004 [P] Configure CI pipeline to run tests, linting, and security dependency checks

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement authentication and role-based authorization framework
- [ ] T006 [P] Establish backend three-layer boundaries and base interfaces
- [ ] T007 [P] Establish frontend three-layer boundaries and API client boundaries
- [ ] T008 Implement global input validation and explicit error response conventions
- [ ] T009 [P] Configure encryption-in-transit and encryption-at-rest mechanisms
- [ ] T010 [P] Implement structured audit logging for security and privileged actions
- [ ] T011 Implement database migration, backup scheduling, and restore verification scaffolding
- [ ] T012 Define public vs authenticated routes to preserve required unauthenticated access

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T013 [P] [US1] Add/extend contract tests in backend/tests/contract/
- [ ] T014 [P] [US1] Add/extend integration tests in backend/tests/integration/
- [ ] T015 [P] [US1] Add/extend UI/e2e tests in frontend/tests/e2e/ (Chrome + Firefox)

### Implementation for User Story 1

- [ ] T016 [US1] Implement presentation-layer changes in frontend/src/presentation/ and backend/src/presentation/
- [ ] T017 [US1] Implement business-layer workflows and objects in frontend/src/business/ and backend/src/business/
- [ ] T018 [US1] Implement data-layer adapters/repositories in frontend/src/data/ and backend/src/data/
- [ ] T019 [US1] Add input validation and explicit user-visible error handling paths
- [ ] T020 [US1] Add/verify RBAC checks for protected actions
- [ ] T021 [US1] Add/verify audit log events for sensitive operations

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T022 [P] [US2] Add/extend contract tests in backend/tests/contract/
- [ ] T023 [P] [US2] Add/extend integration tests in backend/tests/integration/
- [ ] T024 [P] [US2] Add/extend UI/e2e tests in frontend/tests/e2e/ (Chrome + Firefox)

### Implementation for User Story 2

- [ ] T025 [US2] Implement presentation-layer changes in frontend/src/presentation/ and backend/src/presentation/
- [ ] T026 [US2] Implement business-layer workflows and objects in frontend/src/business/ and backend/src/business/
- [ ] T027 [US2] Implement data-layer adapters/repositories in frontend/src/data/ and backend/src/data/
- [ ] T028 [US2] Add input validation and explicit user-visible error handling paths
- [ ] T029 [US2] Add/verify RBAC checks for protected actions
- [ ] T030 [US2] Add/verify audit log events for sensitive operations

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T031 [P] [US3] Add/extend contract tests in backend/tests/contract/
- [ ] T032 [P] [US3] Add/extend integration tests in backend/tests/integration/
- [ ] T033 [P] [US3] Add/extend UI/e2e tests in frontend/tests/e2e/ (Chrome + Firefox)

### Implementation for User Story 3

- [ ] T034 [US3] Implement presentation-layer changes in frontend/src/presentation/ and backend/src/presentation/
- [ ] T035 [US3] Implement business-layer workflows and objects in frontend/src/business/ and backend/src/business/
- [ ] T036 [US3] Implement data-layer adapters/repositories in frontend/src/data/ and backend/src/data/
- [ ] T037 [US3] Add input validation and explicit user-visible error handling paths
- [ ] T038 [US3] Add/verify RBAC checks for protected actions
- [ ] T039 [US3] Add/verify audit log events for sensitive operations

**Checkpoint**: All implemented stories are independently functional

---

## Phase N: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T040 [P] Verify backup job execution and perform restore drill for changed data
- [ ] T041 [P] Execute concurrency and conflict-handling tests for affected workflows
- [ ] T042 [P] Verify Chrome and Firefox compatibility for affected UX paths
- [ ] T043 [P] Validate no plaintext credentials/paper files in persistence and logs
- [ ] T044 Update operational runbooks (availability, incident response, recovery)
- [ ] T045 Confirm constitution compliance checklist is attached to PR/release notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion; can proceed by priority or in parallel
- **Hardening (Final Phase)**: Depends on all implemented user stories

### Within Each User Story

- Tests MUST be written first and observed failing before implementation
- Presentation/business/data layer tasks MUST remain separated
- Validation and explicit error messaging MUST be implemented before story sign-off
- RBAC and audit logging tasks MUST complete for any protected action paths
- Story must pass all tests before moving to next priority

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- After Foundational phase completion, different user stories may run in parallel by different developers
- Test creation tasks within a story can run in parallel

---

## Parallel Example: User Story 1

```bash
# Create tests in parallel (all should fail before implementation)
Task: "Add/extend contract tests in backend/tests/contract/"
Task: "Add/extend integration tests in backend/tests/integration/"
Task: "Add/extend UI/e2e tests in frontend/tests/e2e/"

# Then implement each layer with clear boundaries
Task: "Implement presentation-layer changes"
Task: "Implement business-layer workflows and objects"
Task: "Implement data-layer adapters/repositories"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate tests, security constraints, and browser compatibility for User Story 1
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver User Story 1 and validate independently
3. Deliver User Story 2 and validate independently
4. Deliver User Story 3 and validate independently
5. Execute hardening phase before release

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is complete:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Integrate only after each story independently passes tests and constitution checks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Every story must remain independently completable and testable
- Reliability, confidentiality, and integrity are higher priority than optimization
- Avoid vague tasks and cross-layer shortcuts that violate architecture boundaries
