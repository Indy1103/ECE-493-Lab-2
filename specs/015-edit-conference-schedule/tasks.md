---

description: "Task list for Edit Conference Schedule"
---

# Tasks: Edit Conference Schedule

**Input**: Design documents from `specs/015-edit-conference-schedule/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/openapi.yaml`, `research.md`, `quickstart.md`

**Tests**: Required by constitution and plan. Write failing tests before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature scaffolding and shared plumbing for schedule edits

- [ ] T001 Verify schedule edit routes are registered in `backend/src/presentation/routes/editorRoutes.ts`
- [ ] T002 [P] Add schedule edit API client wrapper in `frontend/src/data/api/scheduleApi.ts`
- [ ] T003 [P] Add shared error type for schedule edit failures in `backend/src/shared/errors/scheduleErrors.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

- [ ] T004 [P] Add integration test for RBAC guard (403) in `backend/tests/integration/scheduleEdit.auth.int.test.ts`
- [ ] T005 [P] Add integration test for validation rejection in `backend/tests/integration/scheduleEdit.validation.int.test.ts`
- [ ] T006 [P] Add concurrency conflict test in `backend/tests/integration/scheduleEdit.concurrency.int.test.ts`

- [ ] T007 Implement editor RBAC guard for schedule edit endpoints in `backend/src/security/guards/editorGuard.ts`
- [ ] T008 [P] Add schedule edit audit log event helpers in `backend/src/shared/audit/scheduleAudit.ts`
- [ ] T009 Define schedule edit validation schema in `backend/src/business/validation/scheduleEditSchema.ts`
- [ ] T010 [P] Add concurrency-safe update helper (transaction + version check) in `backend/src/data/schedules/scheduleConcurrency.ts`
- [ ] T011 Add Prisma schema updates for schedule edit entities in `backend/src/data/prisma/schema.prisma`
- [ ] T012 [P] Create migration for schedule edit entities in `infra/db/migrations/`
- [ ] T013 Add storage encryption verification note for schedule data in `infra/db/backup/encryption.md`
- [ ] T014 Add TLS enforcement note for schedule edit endpoints in `infra/ops/security/tls.md`
- [ ] T015 Add log redaction guidance for schedule edit payloads in `backend/src/shared/logging/redaction.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Update Schedule (Priority: P1) 🎯 MVP

**Goal**: Editor retrieves schedule and submits valid modifications that finalize the schedule.

**Independent Test**: With an existing generated schedule, submit valid modifications and verify the schedule updates and is marked final.

### Tests for User Story 1 (REQUIRED)

- [ ] T016 [P] [US1] Add contract test for GET schedule in `backend/tests/contract/schedule.get.contract.test.ts`
- [ ] T017 [P] [US1] Add contract test for PUT schedule update in `backend/tests/contract/schedule.put.contract.test.ts`
- [ ] T018 [P] [US1] Add integration tests for schedule retrieval/update in `backend/tests/integration/scheduleEdit.int.test.ts`
- [ ] T019 [P] [US1] Add UI/e2e test for valid schedule edits (Chrome + Firefox) in `frontend/tests/e2e/scheduleEdit.valid.e2e.ts`

### Implementation for User Story 1

- [ ] T020 [US1] Implement schedule retrieval query in `backend/src/data/schedules/scheduleRepository.ts`
- [ ] T021 [US1] Implement schedule update transaction (apply entries + set FINAL) in `backend/src/data/schedules/scheduleRepository.ts`
- [ ] T022 [US1] Implement schedule edit workflow service in `backend/src/business/schedules/scheduleEditService.ts`
- [ ] T023 [US1] Wire GET schedule endpoint to service in `backend/src/presentation/controllers/scheduleController.ts`
- [ ] T024 [US1] Wire PUT schedule endpoint to service in `backend/src/presentation/controllers/scheduleController.ts`
- [ ] T025 [US1] Implement schedule edit view and submit flow in `frontend/src/presentation/schedule/ScheduleEditorView.tsx`
- [ ] T026 [US1] Connect UI to API client for load/update in `frontend/src/business/schedule/scheduleEditFacade.ts`
- [ ] T027 [US1] Map API schedule model to UI state in `frontend/src/data/mappers/scheduleMapper.ts`
- [ ] T028 [US1] Add traceability note for UC-15/AT-UC15-01 in `specs/015-edit-conference-schedule/report/traceability.md`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Invalid Modifications (Priority: P1)

**Goal**: Invalid schedule modifications are rejected with explicit errors and no state change.

**Independent Test**: With an existing schedule, submit invalid modifications and verify explicit error response and unchanged schedule.

### Tests for User Story 2 (REQUIRED)

- [ ] T029 [P] [US2] Add contract test for invalid schedule update (400) in `backend/tests/contract/schedule.put.invalid.contract.test.ts`
- [ ] T030 [P] [US2] Add integration tests for invalid modifications in `backend/tests/integration/scheduleEdit.invalid.int.test.ts`
- [ ] T031 [P] [US2] Add UI/e2e test for invalid edits and resubmission in `frontend/tests/e2e/scheduleEdit.invalid.e2e.ts`

### Implementation for User Story 2

- [ ] T032 [US2] Enforce validation rules for referenced entries/rooms/sessions/slots in `backend/src/business/schedules/scheduleEditValidator.ts`
- [ ] T033 [US2] Ensure invalid edits return explicit error responses in `backend/src/presentation/controllers/scheduleController.ts`
- [ ] T034 [US2] Persist modification request status (REJECTED/APPLIED) in `backend/src/data/schedules/scheduleModificationRepository.ts`
- [ ] T035 [US2] Surface validation errors in UI with resubmission support in `frontend/src/presentation/schedule/ScheduleEditorView.tsx`
- [ ] T036 [US2] Add client-side guard to prevent submission with missing references in `frontend/src/business/schedule/scheduleEditFacade.ts`
- [ ] T037 [US2] Reject edits when schedule already FINAL in `backend/src/business/schedules/scheduleEditService.ts`
- [ ] T038 [US2] Add traceability note for UC-15 extension 3a / AT-UC15-02 in `specs/015-edit-conference-schedule/report/traceability.md`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Reliability, security, and operational hardening before release

- [ ] T039 [P] Document schedule edit backup/restore impact in `infra/ops/recovery/schedule-edit.md`
- [ ] T040 [P] Add monitoring metric for schedule edit outcomes in `backend/src/shared/metrics/scheduleMetrics.ts`
- [ ] T041 [P] Add latency check for 5s goal in `backend/tests/integration/scheduleEdit.performance.int.test.ts`
- [ ] T042 [P] Verify Chrome and Firefox compatibility checklist in `specs/015-edit-conference-schedule/quickstart.md`
- [ ] T043 Confirm constitution compliance checklist is attached to PR in `specs/015-edit-conference-schedule/report/constitution-check.md`

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
Task: "Add contract test for GET schedule in backend/tests/contract/schedule.get.contract.test.ts"
Task: "Add integration tests for schedule retrieval/update in backend/tests/integration/scheduleEdit.int.test.ts"
Task: "Add UI/e2e test for valid schedule edits in frontend/tests/e2e/scheduleEdit.valid.e2e.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add contract test for invalid schedule update (400) in backend/tests/contract/schedule.put.invalid.contract.test.ts"
Task: "Add integration tests for invalid modifications in backend/tests/integration/scheduleEdit.invalid.int.test.ts"
Task: "Add UI/e2e test for invalid edits and resubmission in frontend/tests/e2e/scheduleEdit.invalid.e2e.ts"
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
