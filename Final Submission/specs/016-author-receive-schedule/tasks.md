---

description: "Task list for Author Schedule Access"
---

# Tasks: Author Schedule Access

**Input**: Design documents from `specs/016-author-receive-schedule/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/openapi.yaml`, `research.md`, `quickstart.md`

**Tests**: Required by constitution and plan. Write failing tests before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature scaffolding and shared plumbing for author schedule access

- [ ] T001 Verify author schedule routes are registered in `backend/src/presentation/routes/authorRoutes.ts`
- [ ] T002 [P] Add author schedule API client wrapper in `frontend/src/data/api/authorScheduleApi.ts`
- [ ] T003 [P] Add shared error type for schedule access failures in `backend/src/shared/errors/scheduleAccessErrors.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

- [ ] T004 [P] Add integration test for RBAC guard (403) in `backend/tests/integration/authorSchedule.auth.int.test.ts`
- [ ] T005 [P] Add integration test for unpublished schedule (409) in `backend/tests/integration/authorSchedule.unpublished.int.test.ts`
- [ ] T006 [P] Add concurrency access test for schedule reads in `backend/tests/integration/authorSchedule.concurrency.int.test.ts`
- [ ] T007 Implement author RBAC guard for schedule endpoint in `backend/src/security/guards/authorGuard.ts`
- [ ] T008 [P] Add schedule access audit log event helpers in `backend/src/shared/audit/scheduleAccessAudit.ts`
- [ ] T009 Define schedule access validation schema in `backend/src/business/validation/authorScheduleSchema.ts`
- [ ] T010 [P] Add concurrency-safe read helper in `backend/src/data/schedules/scheduleReadConsistency.ts`
- [ ] T011 Add Prisma schema updates for schedule publication/notification entities in `backend/src/data/prisma/schema.prisma`
- [ ] T012 [P] Create migration for schedule publication/notification entities in `infra/db/migrations/`
- [ ] T013 Add storage encryption verification note for schedule data in `infra/db/backup/encryption.md`
- [ ] T014 Add TLS enforcement note for schedule access endpoints in `infra/ops/security/tls.md`
- [ ] T015 Add log redaction guidance for schedule access payloads in `backend/src/shared/logging/redaction.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Receive and View Final Schedule (Priority: P1) 🎯 MVP

**Goal**: Authors receive availability notification and can view the published schedule with their presentation details.

**Independent Test**: With a published final schedule and an accepted-paper author, verify the author is notified and can view the schedule with their presentation details.

### Tests for User Story 1 (REQUIRED)

- [ ] T016 [P] [US1] Add contract test for GET author schedule in `backend/tests/contract/authorSchedule.get.contract.test.ts`
- [ ] T017 [P] [US1] Add integration tests for schedule retrieval in `backend/tests/integration/authorSchedule.int.test.ts`
- [ ] T018 [P] [US1] Add UI/e2e test for published schedule view in `frontend/tests/e2e/authorSchedule.published.e2e.ts`

### Implementation for User Story 1

- [ ] T019 [US1] Implement schedule retrieval query in `backend/src/data/schedules/authorScheduleRepository.ts`
- [ ] T020 [US1] Implement schedule access workflow service in `backend/src/business/schedules/authorScheduleService.ts`
- [ ] T021 [US1] Wire GET author schedule endpoint in `backend/src/presentation/controllers/authorScheduleController.ts`
- [ ] T022 [US1] Implement author schedule view in `frontend/src/presentation/schedule/AuthorScheduleView.tsx`
- [ ] T023 [US1] Connect UI to API client in `frontend/src/business/schedule/authorScheduleFacade.ts`
- [ ] T024 [US1] Map API schedule model to UI state in `frontend/src/data/mappers/authorScheduleMapper.ts`
- [ ] T025 [US1] Record notification creation for authors in `backend/src/data/notifications/authorNotificationRepository.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Schedule Not Yet Published (Priority: P1)

**Goal**: Authors are informed when the schedule is not yet available and no schedule is displayed.

**Independent Test**: With no published final schedule, attempt to view the schedule and confirm an explicit unavailability message is shown.

### Tests for User Story 2 (REQUIRED)

- [ ] T026 [P] [US2] Add contract test for unpublished schedule (409) in `backend/tests/contract/authorSchedule.unpublished.contract.test.ts`
- [ ] T027 [P] [US2] Add integration tests for unpublished schedule handling in `backend/tests/integration/authorSchedule.unpublished.int.test.ts`
- [ ] T028 [P] [US2] Add UI/e2e test for unpublished schedule message in `frontend/tests/e2e/authorSchedule.unpublished.e2e.ts`

### Implementation for User Story 2

- [ ] T029 [US2] Enforce published-status checks in `backend/src/business/schedules/authorScheduleService.ts`
- [ ] T030 [US2] Return explicit unpublished error response in `backend/src/presentation/controllers/authorScheduleController.ts`
- [ ] T031 [US2] Surface unpublished message in UI in `frontend/src/presentation/schedule/AuthorScheduleView.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Reliability, security, and operational hardening before release

- [ ] T032 [P] Document schedule access backup/restore impact in `infra/ops/recovery/author-schedule.md`
- [ ] T033 [P] Add monitoring metric for schedule access outcomes in `backend/src/shared/metrics/authorScheduleMetrics.ts`
- [ ] T034 [P] Add latency check for schedule view responses in `backend/tests/integration/authorSchedule.performance.int.test.ts`
- [ ] T035 [P] Verify Chrome and Firefox compatibility checklist in `specs/016-author-receive-schedule/quickstart.md`
- [ ] T036 Confirm constitution compliance checklist is attached to PR in `specs/016-author-receive-schedule/report/constitution-check.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion; can proceed by priority or in parallel
- **Polish (Phase 5)**: Depends on all implemented user stories

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- After Foundational phase completion, different user stories may run in parallel by different developers

---

## Parallel Example: User Story 1

```bash
Task: "Add contract test for GET author schedule in backend/tests/contract/authorSchedule.get.contract.test.ts"
Task: "Add integration tests for schedule retrieval in backend/tests/integration/authorSchedule.int.test.ts"
Task: "Add UI/e2e test for published schedule view in frontend/tests/e2e/authorSchedule.published.e2e.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add contract test for unpublished schedule (409) in backend/tests/contract/authorSchedule.unpublished.contract.test.ts"
Task: "Add integration tests for unpublished schedule handling in backend/tests/integration/authorSchedule.unpublished.int.test.ts"
Task: "Add UI/e2e test for unpublished schedule message in frontend/tests/e2e/authorSchedule.unpublished.e2e.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate tests, security constraints, and browser compatibility for User Story 1

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver User Story 1 and validate independently
3. Deliver User Story 2 and validate independently
4. Execute Polish phase before release

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is complete:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Integrate only after each story independently passes tests and constitution checks
