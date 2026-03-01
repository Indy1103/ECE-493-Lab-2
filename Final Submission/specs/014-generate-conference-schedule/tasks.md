# Tasks: Generate Conference Schedule

**Input**: Design documents from `specs/014-generate-conference-schedule/`
**Prerequisites**: `specs/014-generate-conference-schedule/plan.md`, `specs/014-generate-conference-schedule/spec.md`, `specs/014-generate-conference-schedule/data-model.md`, `specs/014-generate-conference-schedule/contracts/openapi.yaml`

**Tests**: Tests are REQUIRED by constitution. For every user story, write tests first and verify they fail before implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal scaffolding for schedule feature implementation

- [ ] T001 Create schedule feature folders in backend/src/presentation/schedule/ and backend/src/business/schedule/ and backend/src/data/schedule/
- [ ] T002 [P] Create schedule feature folders in frontend/src/presentation/admin/ and frontend/src/business/ and frontend/src/data/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared controls required before user-story implementation

- [ ] T003 Define administrator-only RBAC policy for scheduling in backend/src/security/rbacPolicies.ts
- [ ] T004 Define audit logging event schema for schedule generation in backend/src/shared/auditEvents.ts
- [ ] T005 Define shared validation/error helpers for schedule generation in backend/src/shared/validation.ts
- [ ] T006 [P] Add security logging constraints for schedule actions in backend/src/shared/logging.ts
- [ ] T007 [P] Add encryption-at-rest verification note for schedule tables in infra/db/backup/README.md

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Generate Draft Schedule (Priority: P1)

**Goal**: Administrator generates a draft schedule that includes all accepted papers ordered by submission time.

**Independent Test**: With accepted papers present, request schedule generation and verify a draft schedule is returned and displayed in order.

### Tests for User Story 1 (REQUIRED)

- [ ] T008 [P] [US1] Add contract tests for schedule generation and retrieval in backend/tests/contract/schedule.spec.ts
- [ ] T009 [P] [US1] Add integration tests for schedule generation ordering and RBAC in backend/tests/integration/schedule.spec.ts
- [ ] T010 [P] [US1] Add e2e UI tests for admin schedule generation in frontend/tests/e2e/admin-schedule.spec.ts

### Implementation for User Story 1

- [ ] T011 [US1] Add schedule data models to backend/src/data/prisma/schema.prisma
- [ ] T012 [US1] Add schedule repository for create/read draft schedules in backend/src/data/schedule/scheduleRepository.ts
- [ ] T013 [US1] Implement schedule generation rules (order by submission time, draft only) in backend/src/business/schedule/generateScheduleService.ts
- [ ] T014 [US1] Implement schedule retrieval service in backend/src/business/schedule/getScheduleService.ts
- [ ] T015 [US1] Add schedule generation endpoint in backend/src/presentation/schedule/generateScheduleRoute.ts
- [ ] T016 [US1] Add schedule retrieval endpoint in backend/src/presentation/schedule/getScheduleRoute.ts
- [ ] T017 [US1] Enforce admin RBAC and audit logging in backend/src/presentation/schedule/generateScheduleRoute.ts
- [ ] T018 [US1] Add API client for schedule endpoints in frontend/src/data/scheduleApi.ts
- [ ] T019 [US1] Add schedule business adapter in frontend/src/business/scheduleService.ts
- [ ] T020 [US1] Add admin UI for schedule generation and viewing in frontend/src/presentation/admin/ScheduleGenerationPage.tsx

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - No Accepted Papers (Priority: P1)

**Goal**: When no accepted papers exist, schedule generation is blocked and an explicit error is presented.

**Independent Test**: With no accepted papers, request schedule generation and verify explicit error with no schedule created.

### Tests for User Story 2 (REQUIRED)

- [ ] T021 [P] [US2] Add contract tests for no-accepted-papers error in backend/tests/contract/schedule-errors.spec.ts
- [ ] T022 [P] [US2] Add integration tests for no-accepted-papers behavior in backend/tests/integration/schedule-errors.spec.ts
- [ ] T023 [P] [US2] Add e2e UI tests for no-accepted-papers error in frontend/tests/e2e/admin-schedule-errors.spec.ts

### Implementation for User Story 2

- [ ] T024 [US2] Add accepted-paper existence check in backend/src/business/schedule/generateScheduleService.ts
- [ ] T025 [US2] Add explicit no-accepted-papers error mapping in backend/src/shared/validation.ts
- [ ] T026 [US2] Return user-visible error from backend/src/presentation/schedule/generateScheduleRoute.ts
- [ ] T027 [US2] Display no-accepted-papers error in frontend/src/presentation/admin/ScheduleGenerationPage.tsx

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment with reliability and operational requirements

- [ ] T028 [P] Add concurrency guard or idempotent generation handling in backend/src/business/schedule/generateScheduleService.ts
- [ ] T029 [P] Add backup/restore verification note for schedule tables in infra/db/backup/README.md
- [ ] T030 [P] Update operational runbook for schedule generation in infra/ops/monitoring/runbook.md
- [ ] T031 [P] Verify Chrome/Firefox UX compatibility for schedule UI in frontend/tests/e2e/admin-schedule.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3-4)**: Depend on Foundational completion
- **Polish (Phase 5)**: Depends on User Story completion

### Parallel Opportunities

- T002 can run in parallel with T001.
- T003, T004, T005, T006, and T007 can run in parallel after Phase 1.
- T008, T009, T010 can run in parallel within US1 tests.
- T021, T022, T023 can run in parallel within US2 tests.
- T028, T029, T030, T031 can run in parallel after User Stories complete.

## Parallel Example: User Story 1

- T012 Implement schedule repository in backend/src/data/schedule/scheduleRepository.ts
- T015 Add schedule generation endpoint in backend/src/presentation/schedule/generateScheduleRoute.ts
- T018 Add API client in frontend/src/data/scheduleApi.ts
