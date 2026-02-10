# Tasks: Assign Referees to Submitted Papers

**Input**: Design documents from `/specs/007-assign-paper-referees/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are REQUIRED for this feature by constitution/plan and quickstart; apply Red-Green-Refactor per user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature module structure and test harnesses for UC-07.

- [ ] T001 Create backend module folders for referee assignment flows in `backend/src/presentation/referee-assignments/`, `backend/src/business/referee-assignments/`, and `backend/src/data/referee-assignments/`
- [ ] T002 Create frontend module folders for assignment UI flows in `frontend/src/presentation/referee-assignments/`, `frontend/src/business/referee-assignments/`, and `frontend/src/data/referee-assignments/`
- [ ] T003 [P] Register contract artifact path `specs/007-assign-paper-referees/contracts/referee-assignments.openapi.yaml` in `backend/package.json`
- [ ] T004 [P] Create test suite placeholders in `backend/tests/contract/referee-assignments/`, `backend/tests/integration/referee-assignments/`, and `frontend/tests/e2e/referee-assignments/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared foundations required by all user stories.

**⚠️ CRITICAL**: No user story implementation begins until this phase is complete.

- [ ] T005 [P] Add failing integration test for editor-role authorization guard in `backend/tests/integration/referee-assignments/editorAuth.foundation.integration.test.ts`
- [ ] T006 [P] Add failing integration test for per-paper serialized transaction behavior in `backend/tests/integration/referee-assignments/perPaperSerialization.foundation.integration.test.ts`
- [ ] T007 [P] Add failing integration test for duplicate-referee atomic rejection baseline in `backend/tests/integration/referee-assignments/duplicateAtomicity.foundation.integration.test.ts`
- [ ] T008 [P] Add failing integration test for no-sensitive-data logging baseline in `backend/tests/integration/referee-assignments/logRedaction.foundation.integration.test.ts`
- [ ] T009 Create Prisma migration for `RefereeAssignment`, `ReviewInvitation`, and assignment audit tables in `backend/prisma/migrations/*_referee_assignments_uc07/migration.sql`
- [ ] T010 Update Prisma schema enums/relations for assignment and invitation lifecycle in `backend/prisma/schema.prisma`
- [ ] T011 [P] Implement shared request validation schemas for assignment options and assignment request payloads in `backend/src/business/referee-assignments/refereeAssignmentSchemas.ts`
- [ ] T012 [P] Implement editor RBAC guard middleware for assignment routes in `backend/src/security/editorAssignmentGuard.ts`
- [ ] T013 Implement repository interfaces and transaction boundary contracts in `backend/src/data/referee-assignments/RefereeAssignmentRepository.ts`
- [ ] T014 [P] Implement assignment/invitation audit event helpers in `backend/src/shared/audit/refereeAssignmentAudit.ts`
- [ ] T015 [P] Document backup/restore coverage for new assignment-related tables in `infra/ops/backup-restore.md`

**Checkpoint**: Auth, persistence, validation, locking, audit, and backup foundations are ready.

---

## Phase 3: User Story 1 - Assign Eligible Referees (Priority: P1) 🎯 MVP

**Goal**: Allow authenticated editors to assign eligible referees atomically and trigger invitation handling.

**Independent Test**: With valid editor session, assignment-eligible paper, and eligible referees, submit referee IDs and verify committed assignments plus invitation status feedback.

### Tests for User Story 1 (REQUIRED)

- [ ] T016 [P] [US1] Add failing contract test for `GET /api/v1/papers/{paperId}/referee-assignment-options` success/auth errors in `backend/tests/contract/referee-assignments/getAssignmentOptions.contract.test.ts`
- [ ] T017 [P] [US1] Add failing contract test for `POST /api/v1/papers/{paperId}/referee-assignments` success and atomic `400` validation response in `backend/tests/contract/referee-assignments/postAssignments.contract.test.ts`
- [ ] T018 [P] [US1] Add failing integration test for successful atomic multi-referee assignment commit in `backend/tests/integration/referee-assignments/assignReferees.success.integration.test.ts`
- [ ] T019 [P] [US1] Add failing integration test for invitation failure non-rollback behavior in `backend/tests/integration/referee-assignments/invitationNonRollback.integration.test.ts`
- [ ] T020 [P] [US1] Add failing UI/e2e test for editor assignment success flow in `frontend/tests/e2e/referee-assignments/assignReferees.success.e2e.test.ts`

### Implementation for User Story 1

- [ ] T021 [US1] Implement assignment options query use case in `backend/src/business/referee-assignments/GetAssignmentOptionsUseCase.ts`
- [ ] T022 [US1] Implement atomic assignment orchestration use case in `backend/src/business/referee-assignments/AssignRefereesUseCase.ts`
- [ ] T023 [US1] Implement transactional repository with per-paper lock and bulk insert behavior in `backend/src/data/referee-assignments/PrismaRefereeAssignmentRepository.ts`
- [ ] T024 [US1] Implement assignment options route handler in `backend/src/presentation/referee-assignments/getAssignmentOptionsHandler.ts`
- [ ] T025 [US1] Implement assignment submission route handler in `backend/src/presentation/referee-assignments/postRefereeAssignmentsHandler.ts`
- [ ] T026 [US1] Implement invitation intent persistence and async dispatch adapter in `backend/src/business/referee-assignments/InvitationDispatchService.ts`
- [ ] T027 [US1] Implement frontend assignment options API client in `frontend/src/data/referee-assignments/getAssignmentOptionsClient.ts`
- [ ] T028 [US1] Implement frontend referee assignment API client in `frontend/src/data/referee-assignments/postRefereeAssignmentsClient.ts`
- [ ] T029 [US1] Implement editor assignment action state workflow in `frontend/src/business/referee-assignments/assignRefereesAction.ts`
- [ ] T030 [US1] Implement editor assignment panel UI for valid assignment flow in `frontend/src/presentation/referee-assignments/RefereeAssignmentPanel.tsx`
- [ ] T031 [US1] Emit assignment and invitation success/retryable audit events in `backend/src/shared/audit/refereeAssignmentAudit.ts`

**Checkpoint**: US1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Reject Workload-Violating Referee Assignment (Priority: P1)

**Goal**: Reject workload-violating assignment attempts with explicit feedback and no persisted assignments from that request.

**Independent Test**: Attempt assigning at-limit referee and verify explicit workload violation with zero new assignments.

### Tests for User Story 2 (REQUIRED)

- [ ] T032 [P] [US2] Add failing contract test for workload violation response structure (`400`) in `backend/tests/contract/referee-assignments/workloadViolation.contract.test.ts`
- [ ] T033 [P] [US2] Add failing integration test for at-limit referee rejection with atomic no-write guarantee in `backend/tests/integration/referee-assignments/workloadViolation.integration.test.ts`
- [ ] T034 [P] [US2] Add failing integration test for retry with alternate eligible referee success path in `backend/tests/integration/referee-assignments/workloadRetry.integration.test.ts`
- [ ] T035 [P] [US2] Add failing UI/e2e test for workload violation message and resubmission flow in `frontend/tests/e2e/referee-assignments/workloadViolation.e2e.test.ts`

### Implementation for User Story 2

- [ ] T036 [US2] Implement referee workload policy evaluation rules in `backend/src/business/referee-assignments/WorkloadPolicyEvaluator.ts`
- [ ] T037 [US2] Implement workload-violation error mapping and message standardization in `backend/src/presentation/referee-assignments/refereeAssignmentErrorMapper.ts`
- [ ] T038 [US2] Implement no-partial-write safeguard branch for workload failures in `backend/src/business/referee-assignments/AssignRefereesUseCase.ts`
- [ ] T039 [US2] Implement frontend workload violation rendering and retry-ready state in `frontend/src/presentation/referee-assignments/RefereeAssignmentPanel.tsx`
- [ ] T040 [US2] Emit workload-rejection audit events with reason codes in `backend/src/shared/audit/refereeAssignmentAudit.ts`

**Checkpoint**: US2 is fully functional and independently testable.

---

## Phase 5: User Story 3 - Enforce Maximum Referees per Paper (Priority: P2)

**Goal**: Prevent additional assignments when paper capacity is reached and provide explicit no-capacity feedback.

**Independent Test**: For a paper at max referee count, submit assignment request and verify explicit no-capacity rejection with no new assignments.

### Tests for User Story 3 (REQUIRED)

- [ ] T041 [P] [US3] Add failing contract test for paper-capacity violation response (`400`/rule code) in `backend/tests/contract/referee-assignments/paperCapacityViolation.contract.test.ts`
- [ ] T042 [P] [US3] Add failing integration test for max-referees rejection with persisted-state unchanged in `backend/tests/integration/referee-assignments/paperCapacityViolation.integration.test.ts`
- [ ] T043 [P] [US3] Add failing integration test for concurrent assignment attempts preserving capacity integrity in `backend/tests/integration/referee-assignments/paperCapacityConcurrency.integration.test.ts`
- [ ] T044 [P] [US3] Add failing UI/e2e test for no-capacity feedback in editor assignment panel in `frontend/tests/e2e/referee-assignments/paperCapacityViolation.e2e.test.ts`

### Implementation for User Story 3

- [ ] T045 [US3] Implement paper capacity policy evaluation using conference assignment limits in `backend/src/business/referee-assignments/PaperCapacityPolicyEvaluator.ts`
- [ ] T046 [US3] Implement no-capacity response mapping consistency in `backend/src/presentation/referee-assignments/refereeAssignmentErrorMapper.ts`
- [ ] T047 [US3] Implement capacity-check integration in assignment orchestration before persistence in `backend/src/business/referee-assignments/AssignRefereesUseCase.ts`
- [ ] T048 [US3] Implement frontend no-capacity feedback handling in `frontend/src/presentation/referee-assignments/RefereeAssignmentPanel.tsx`
- [ ] T049 [US3] Emit paper-capacity rejection audit events in `backend/src/shared/audit/refereeAssignmentAudit.ts`

**Checkpoint**: US3 is fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final reliability/security hardening and release readiness.

- [ ] T050 [P] Add integration test for duplicate referee IDs in one request with explicit duplicate-entry feedback in `backend/tests/integration/referee-assignments/duplicateRefereeValidation.integration.test.ts`
- [ ] T051 [P] Add integration test for invalid/non-assignable referee IDs with atomic rejection in `backend/tests/integration/referee-assignments/refereeNotAssignable.integration.test.ts`
- [ ] T052 [P] Add integration test for unauthenticated and non-editor access rejections in `backend/tests/integration/referee-assignments/authFailures.integration.test.ts`
- [ ] T053 [P] Add integration test for sensitive-field log redaction across failure paths in `backend/tests/integration/referee-assignments/securityRedaction.integration.test.ts`
- [ ] T054 [P] Validate Chrome and Firefox assignment flows in `frontend/tests/e2e/referee-assignments/`
- [ ] T055 Update operational retry and failure handling runbook for invitation dispatch in `infra/ops/incident-response.md`
- [ ] T056 Update feature quickstart verification steps with implemented evidence links in `specs/007-assign-paper-referees/quickstart.md`
- [ ] T057 [P] Add failing integration test enforcing TLS-only access for referee assignment endpoints in `backend/tests/integration/referee-assignments/transportSecurity.integration.test.ts`
- [ ] T058 Implement transport security enforcement for assignment routes in `backend/src/presentation/referee-assignments/refereeAssignmentRouteSecurity.ts`
- [ ] T059 [P] Add integration test verifying assignment/invitation sensitive fields are protected at rest per deployment policy in `backend/tests/integration/referee-assignments/atRestProtection.integration.test.ts`
- [ ] T060 Implement persistence-layer hooks and config wiring for at-rest protection assertions in `backend/src/data/referee-assignments/PrismaRefereeAssignmentRepository.ts` and `infra/ops/backup-restore.md`
- [ ] T061 Implement configured invitation retry policy (max attempts, backoff, terminal state) in `backend/src/business/referee-assignments/InvitationDispatchService.ts`
- [ ] T062 [P] Add failing integration test for invitation retry budget exhaustion terminal state in `backend/tests/integration/referee-assignments/invitationRetryBudget.integration.test.ts`
- [ ] T063 Maintain requirement-to-test traceability matrix for UC-07 and AT-UC07-01/02/03 in `specs/007-assign-paper-referees/quickstart.md`

---

## Dependencies & Execution Order

### Story Dependency Graph

- Phase 2 (Foundational) -> US1 (Phase 3)
- Phase 2 (Foundational) -> US2 (Phase 4)
- Phase 2 (Foundational) -> US3 (Phase 5)
- US1 + US2 + US3 -> Phase 6 (Polish)

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2.
- **Phase 5 (US3)**: Depends on Phase 2.
- **Phase 6 (Polish)**: Depends on completed story phases.

### Within Each User Story

- Tests MUST be written first and observed failing before implementation.
- Business/data/presentation layering MUST remain separated.
- Validation and explicit user-visible feedback MUST be complete before story sign-off.

## Parallel Execution Examples

### User Story 1

- Run in parallel: `T016`, `T017`, `T018`, `T019`, `T020`.
- After use-case scaffolding (`T021`, `T022`), run data and presentation tasks in parallel: `T023`, `T024`, `T025`.
- Run frontend tasks in parallel once API contract is stable: `T027`, `T028`, `T029`, then complete `T030`.

### User Story 2

- Run in parallel: `T032`, `T033`, `T034`, `T035`.
- Run `T036` and `T037` in parallel, then complete `T038`, `T039`, `T040`.

### User Story 3

- Run in parallel: `T041`, `T042`, `T043`, `T044`.
- Run `T045` and `T046` in parallel, then complete `T047`, `T048`, `T049`.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1) and validate independent tests.
4. Demo/deploy MVP assignment baseline.

### Incremental Delivery

1. Deliver US1 baseline assignment capability.
2. Deliver US2 workload-violation behavior.
3. Deliver US3 paper-capacity enforcement.
4. Complete Phase 6 hardening tasks.

### Parallel Team Strategy

1. Team completes Setup and Foundational phases together.
2. After Phase 2, split story tracks:
   - Engineer A: US1 backend/data + invitation integration.
   - Engineer B: US2 validation/error UX.
   - Engineer C: US3 capacity/concurrency paths.
3. Integrate only after each story independently passes required tests.

## Notes

- `[P]` tasks indicate file-level parallelization opportunities.
- User story labels are used only in story phases.
- All tasks include explicit target file paths and are executable without extra context.
