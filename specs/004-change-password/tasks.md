# Tasks: Change Account Password

**Input**: Design documents from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/004-change-password/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are REQUIRED. For each user story, create failing tests first and verify failure before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story so each story remains independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`)
- All tasks include explicit file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize feature scaffolding and test harnesses.

- [ ] T001 Create password-change module folders in `backend/src/presentation/account/`, `backend/src/business/account/`, `backend/src/data/account/`, and `frontend/src/presentation/account/`
- [ ] T002 Create shared domain/error scaffolds for password change in `backend/src/business/domain/password-change.ts` and `backend/src/shared/errors/password-change-errors.ts`
- [ ] T003 [P] Create migration scaffold for password history/attempt/session updates in `infra/db/migrations/004_change_password.sql`
- [ ] T004 [P] Create contract test scaffold in `backend/tests/contract/password-change.contract.test.ts`
- [ ] T005 [P] Create integration test scaffold in `backend/tests/integration/password-change.integration.test.ts`
- [ ] T006 [P] Create e2e test scaffold in `frontend/tests/e2e/change-password.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement required shared controls before user-story delivery.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [ ] T007 Implement authenticated-session guard and invalid/expired-session rejection baseline in `backend/src/presentation/middleware/session-auth.ts`
- [ ] T008 [P] Implement password-change request schema validation (`currentPassword`, `newPassword`, `confirmNewPassword`) in `backend/src/business/validation/password-change.schema.ts`
- [ ] T009 [P] Implement password hashing/verification service wrapper (Argon2) in `backend/src/business/security/password-hash.service.ts`
- [ ] T010 Implement credential transaction repository interface for atomic update/versioning in `backend/src/data/account/account-credential.repository.ts`
- [ ] T011 [P] Implement password-change throttle repository (per-account + per-IP) in `backend/src/data/security/password-change-throttle.repository.ts`
- [ ] T012 [P] Implement audit event writer for password-change outcomes in `backend/src/business/observability/password-change-audit.service.ts`
- [ ] T013 Implement session repository operations for revoke-all-on-password-change in `backend/src/data/security/session.repository.ts`
- [ ] T014 Implement API contract wiring skeleton for `POST /api/v1/account/password-change` in `backend/src/presentation/account/password-change.controller.ts`

**Checkpoint**: Foundation complete; user stories can begin.

---

## Phase 3: User Story 1 - Successful Password Change (Priority: P1) 🎯 MVP

**Goal**: Allow an authenticated registered user to successfully change password and force re-authentication.

**Independent Test**: From an active session, submit valid current/new/confirm passwords; verify success response, credential update, session revocation, and required re-login.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T015 [P] [US1] Add failing contract test for successful `200` password change response in `backend/tests/contract/password-change.contract.test.ts`
- [ ] T016 [P] [US1] Add failing integration test for credential update, password-history insert, and session revocation in `backend/tests/integration/password-change.integration.test.ts`
- [ ] T017 [P] [US1] Add failing e2e success flow test (change password then re-authenticate) in `frontend/tests/e2e/change-password.spec.ts`

### Implementation for User Story 1

- [ ] T018 [US1] Implement success-path HTTP handling for password change in `backend/src/presentation/account/password-change.controller.ts`
- [ ] T019 [US1] Implement orchestration service for current-password verification and policy checks in `backend/src/business/account/change-password.service.ts`
- [ ] T020 [US1] Implement atomic credential update + password-history write in `backend/src/data/account/account-credential.repository.ts`
- [ ] T021 [US1] Implement revoke-all-active-sessions on successful change in `backend/src/business/security/session-revocation.service.ts`
- [ ] T022 [US1] Implement frontend API client for password-change success contract in `frontend/src/business/account/password-change.client.ts`
- [ ] T023 [US1] Implement password-change form success flow and re-login redirect in `frontend/src/presentation/account/change-password-form.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Invalid Password Change Rejection (Priority: P1)

**Goal**: Reject invalid password-change attempts with explicit feedback while preserving existing credential state.

**Independent Test**: From an active or expired session, submit invalid password-change input (policy failures, mismatched confirm, wrong current password, throttled path); verify explicit failure messaging and no credential mutation.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T024 [P] [US2] Add failing contract tests for `400`, `401`, `429`, and `500` password-change responses in `backend/tests/contract/password-change.contract.test.ts`
- [ ] T025 [P] [US2] Add failing integration tests for invalid current password, expired session, throttling, and rollback-on-failure behavior in `backend/tests/integration/password-change.integration.test.ts`
- [ ] T026 [P] [US2] Add failing e2e test for invalid submission correction/retry messaging in `frontend/tests/e2e/change-password.spec.ts`

### Implementation for User Story 2

- [ ] T027 [US2] Implement explicit validation-failure reason mapping (including password history rule) in `backend/src/business/account/password-change-validation.service.ts`
- [ ] T028 [US2] Implement explicit invalid/expired-session authorization failure responses in `backend/src/presentation/account/password-change.controller.ts`
- [ ] T029 [US2] Implement per-account and per-IP throttle enforcement with temporary lockout in `backend/src/business/security/password-change-throttle.service.ts`
- [ ] T030 [US2] Implement operational-failure compensation/rollback behavior for multi-step password change in `backend/src/business/account/change-password.service.ts`
- [ ] T031 [US2] Implement frontend error-state rendering for validation/auth/throttle/operational failures in `frontend/src/presentation/account/change-password-errors.tsx`
- [ ] T032 [US2] Implement typed API error handling for `400/401/409/429/500` outcomes in `frontend/src/business/account/password-change.client.ts`

**Checkpoint**: User Stories 1 and 2 both pass independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, observability, and release-readiness checks.

- [ ] T033 [P] Add/verify log redaction rules for credential material in `backend/src/shared/logging/redaction.ts`
- [ ] T034 [P] Add Prometheus counters/timers for password-change outcomes in `backend/src/business/observability/password-change-metrics.ts`
- [ ] T035 [P] Add backup/restore verification notes for password-change data in `infra/ops/recovery/password-change-recovery.md`
- [ ] T036 Validate OpenAPI examples and response descriptions against implemented behavior in `specs/004-change-password/contracts/password-change.openapi.yaml`
- [ ] T037 Record feature validation steps and final test run matrix in `specs/004-change-password/quickstart.md`
- [ ] T038 Record constitution compliance evidence for this feature delivery in `specs/004-change-password/plan.md`
- [ ] T039 [P] Execute affected password-change UI flows in Chrome and Firefox and record results in `specs/004-change-password/quickstart.md`
- [ ] T040 [P] Add performance test for password-change p95 latency target in `backend/tests/integration/password-change.performance.test.ts`
- [ ] T041 Record p95 performance results in `specs/004-change-password/quickstart.md`
- [ ] T042 Execute backup restore drill for password-change-affected credential/session/audit data and record pass/fail evidence in `infra/ops/recovery/password-change-recovery.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; may reuse US1 components but remains independently testable via US2-specific failure-path tests.
- **Phase 5 (Polish)**: Depends on completed user stories.

### User Story Completion Order

1. **US1 (P1)**
2. **US2 (P1)**

### Within Each User Story

- Write tests first, verify they fail, then implement.
- Keep presentation/business/data responsibilities separated.
- Story is complete only when its independent test criteria passes.

---

## Parallel Execution Examples

### User Story 1

```bash
# Parallel test-first tasks
T015 backend/tests/contract/password-change.contract.test.ts
T016 backend/tests/integration/password-change.integration.test.ts
T017 frontend/tests/e2e/change-password.spec.ts
```

### User Story 2

```bash
# Parallel test-first tasks
T024 backend/tests/contract/password-change.contract.test.ts
T025 backend/tests/integration/password-change.integration.test.ts
T026 frontend/tests/e2e/change-password.spec.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate independent test for US1 before expanding scope.

### Incremental Delivery

1. Deliver US1 (success path).
2. Deliver US2 (invalid/rejection paths and resilience behavior).
3. Execute Phase 5 hardening and release checks.

### Team Parallelization

1. Complete foundational work together.
2. Split parallelizable `[P]` tasks across backend, frontend, and test streams.
3. Merge only after per-story independent tests pass.

---

## Notes

- Tasks marked `[P]` are safe parallel candidates when their dependencies are satisfied.
- `[US1]` and `[US2]` labels provide explicit story traceability to UC-04 and AT-UC04-01/02.
- Every task line follows the required checklist format with checkbox, task ID, optional markers, and explicit file path.
