# Tasks: Generate Conference Schedule (UC-14)

## Phase 1: Setup

- [X] T001 Create backend module directories under `backend/src/presentation/conference-schedule`, `backend/src/business/conference-schedule`, `backend/src/data/conference-schedule`
- [X] T002 Create frontend module directories under `frontend/src/presentation/conference-schedule`, `frontend/src/business/conference-schedule`, `frontend/src/data/conference-schedule`
- [X] T003 [P] Create test directories `backend/tests/contract/conference-schedule` and `backend/tests/integration/conference-schedule`
- [X] T004 [P] Add UC-14 infrastructure placeholders in `infra/db/migrations` and `infra/ops/monitoring`

## Phase 2: Foundation

- [X] T005 Implement outcome constants in `backend/src/business/conference-schedule/schedule-outcome.ts`
- [X] T006 [P] Implement repository interfaces in `backend/src/business/conference-schedule/ports.ts`
- [X] T007 [P] Implement schedule builder in `backend/src/business/conference-schedule/schedule-builder.ts`
- [X] T008 Implement service in `backend/src/business/conference-schedule/generate-conference-schedule.service.ts`
- [X] T009 [P] Implement repositories in `backend/src/data/conference-schedule/conference-schedule.repository.ts`
- [X] T010 Implement error mapper in `backend/src/presentation/conference-schedule/error-mapper.ts`
- [X] T011 Implement audit logger in `backend/src/business/conference-schedule/audit-logger.ts`
- [X] T012 Implement admin schedule session guard wiring in `backend/src/security/session-guard.ts`

## Phase 3: US1 Schedule Generated

- [X] T013 [P] Add contract success test in `backend/tests/contract/conference-schedule/conference-schedule.contract.test.ts`
- [X] T014 [P] Add integration success test in `backend/tests/integration/conference-schedule/conference-schedule-success.integration.test.ts`
- [X] T015 Implement handler in `backend/src/presentation/conference-schedule/generate-conference-schedule.handler.ts`
- [X] T016 Implement routes in `backend/src/presentation/conference-schedule/routes.ts`
- [X] T017 Implement frontend API client in `frontend/src/data/conference-schedule/conference-schedule.api.ts`
- [X] T018 Implement frontend use case in `frontend/src/business/conference-schedule/generate-conference-schedule.use-case.ts`
- [X] T019 Implement frontend page in `frontend/src/presentation/conference-schedule/conference-schedule-page.tsx`

## Phase 4: US2 No Accepted Papers

- [X] T020 [P] Add contract no-accepted-papers test in `backend/tests/contract/conference-schedule/conference-schedule-no-accepted.contract.test.ts`
- [X] T021 [P] Add integration no-accepted-papers test in `backend/tests/integration/conference-schedule/conference-schedule-no-accepted.integration.test.ts`
- [X] T022 Implement no-accepted-papers mapping in service and mapper
- [X] T023 Implement frontend no-accepted-papers handling

## Phase 5: Hardening

- [X] T024 [P] Add integration concurrency test in `backend/tests/integration/conference-schedule/conference-schedule-concurrency.integration.test.ts`
- [X] T025 [P] Add integration TLS test in `backend/tests/integration/conference-schedule/conference-schedule-tls.integration.test.ts`
- [X] T026 [P] Add integration audit sanitization test in `backend/tests/integration/conference-schedule/conference-schedule-audit-sanitization.integration.test.ts`
- [X] T027 Add unit support coverage in `backend/tests/unit/conferenceScheduleSupport.unit.test.ts`
- [X] T028 Update recovery notes in `infra/ops/recovery/conference-schedule-recovery.md`
- [X] T029 Update quickstart checklist in `specs/014-generate-conference-schedule/quickstart.md`
- [X] T030 Add library-first note in `specs/014-generate-conference-schedule/plan.md`
