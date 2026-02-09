# Tasks: User Login Authentication

**Input**: Design documents from `/specs/003-user-login/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. Write tests first and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label for story-phase tasks only
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize folders, baseline configs, and reusable fixtures.

- [ ] T001 Create backend auth folders in `backend/src/presentation/auth/`
- [ ] T002 Create backend business auth folders in `backend/src/business/auth/`
- [ ] T003 [P] Create backend data auth folders in `backend/src/data/auth/`
- [ ] T004 [P] Create backend security auth folders in `backend/src/security/auth/`
- [ ] T005 [P] Create frontend login presentation folder in `frontend/src/presentation/login/`
- [ ] T006 [P] Create frontend login business/data folders in `frontend/src/business/login/`
- [ ] T007 [P] Create backend auth test folders in `backend/tests/`
- [ ] T008 [P] Create frontend login test folders in `frontend/tests/`
- [ ] T009 [P] Add login seed fixture for existing accounts in `infra/db/seeds/login-users.seed.sql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement cross-story requirements for security, reliability, and architecture.

**⚠️ CRITICAL**: All tasks in this phase must complete before user story work.

### Tests for Foundational Controls (REQUIRED)

- [ ] T010 [P] Add failing test for TLS-only login transport rejection in `backend/tests/integration/auth/login-tls-only.integration.test.ts`
- [ ] T011 [P] Add failing test for at-rest encryption coverage (auth records + backups) in `backend/tests/integration/auth/login-at-rest-encryption.integration.test.ts`
- [ ] T012 [P] Add failing test for no-plaintext credential handling in `backend/tests/integration/auth/login-no-plaintext.integration.test.ts`
- [ ] T013 [P] Add failing test for concurrent login attempt safety in `backend/tests/integration/auth/login-concurrency.integration.test.ts`
- [ ] T014 [P] Add failing test for deterministic outcome mapping in `backend/tests/integration/auth/login-deterministic-outcomes.integration.test.ts`

### Implementation for Foundational Controls

- [ ] T015 Implement login request/response validation schemas in `backend/src/business/auth/login.schemas.ts`
- [ ] T016 [P] Implement auth repository interface contract in `backend/src/data/auth/auth.repository.ts`
- [ ] T017 [P] Implement Argon2 password verifier adapter in `backend/src/security/auth/password-verifier.ts`
- [ ] T018 Implement failed-login throttle policy service in `backend/src/business/auth/throttle-policy.ts`
- [ ] T019 Implement role-permission and role-home policy service in `backend/src/business/auth/role-policy.ts`
- [ ] T020 Implement TLS-only enforcement middleware for login route in `backend/src/presentation/auth/tls-only.middleware.ts`
- [ ] T021 Implement at-rest protection policy wiring for auth persistence in `backend/src/data/auth/data-protection.policy.ts`
- [ ] T022 Implement login observability hooks (audit logs + metrics + request ID) in `backend/src/shared/observability/login-observability.ts`
- [ ] T023 Implement auth persistence migration (attempts/sessions/throttle records) in `infra/db/migrations/20260209_login_auth.sql`

**Checkpoint**: Foundational prerequisites complete.

---

## Phase 3: User Story 1 - Successful Authentication to Role Home (Priority: P1)

**Goal**: Authenticate valid credentials and route the user to the correct role-specific home page.

**Independent Test**: Valid credentials return `200 AUTHENTICATED` with role-home path, create an authenticated session, and deny access when role mapping is unavailable.

### Tests for User Story 1 (REQUIRED)

- [ ] T024 [P] [US1] Add failing contract test for login success response in `backend/tests/contract/auth/login.success.contract.test.ts`
- [ ] T025 [P] [US1] Add failing contract test for role-mapping denial (`403`) in `backend/tests/contract/auth/login.role-mapping.contract.test.ts`
- [ ] T026 [P] [US1] Add failing integration test for session creation on successful login in `backend/tests/integration/auth/login-success.integration.test.ts`
- [ ] T027 [P] [US1] Add failing frontend unit test for success state transition in `frontend/tests/unit/login/login-success-state.test.ts`
- [ ] T028 [P] [US1] Add failing e2e test for successful login redirect in `frontend/tests/e2e/login/login-success.e2e.spec.ts`

### Implementation for User Story 1

- [ ] T029 [US1] Implement account/session repository adapter in `backend/src/data/auth/login.repository.prisma.ts`
- [ ] T030 [US1] Implement successful login use case orchestration in `backend/src/business/auth/login-success.use-case.ts`
- [ ] T031 [US1] Implement login controller success and role-mapping-denial path in `backend/src/presentation/auth/login.controller.ts`
- [ ] T032 [US1] Implement login route registration in `backend/src/presentation/auth/login.routes.ts`
- [ ] T033 [US1] Implement frontend login API client for success path in `frontend/src/data/login/login.api.ts`
- [ ] T034 [US1] Implement frontend login service success handling in `frontend/src/business/login/login.service.ts`
- [ ] T035 [US1] Implement login page submit and role-home navigation flow in `frontend/src/presentation/login/LoginPage.tsx`

**Checkpoint**: US1 is independently testable and complete.

---

## Phase 4: User Story 2 - Invalid Credential Rejection (Priority: P1)

**Goal**: Reject invalid credentials with explicit safe messaging and maintain unauthenticated state, including throttled and unavailable outcomes.

**Independent Test**: Invalid credentials return `401 INVALID_CREDENTIALS`, repeated failures return `429 LOGIN_THROTTLED`, operational failure returns `503 AUTHENTICATION_UNAVAILABLE`, and no protected access is granted.

### Tests for User Story 2 (REQUIRED)

- [ ] T036 [P] [US2] Add failing contract test for invalid credentials (`401`) in `backend/tests/contract/auth/login-invalid.contract.test.ts`
- [ ] T037 [P] [US2] Add failing contract test for throttled response (`429`) in `backend/tests/contract/auth/login-throttled.contract.test.ts`
- [ ] T038 [P] [US2] Add failing contract test for unavailable response (`503`) in `backend/tests/contract/auth/login-unavailable.contract.test.ts`
- [ ] T039 [P] [US2] Add failing integration test for throttle window behavior in `backend/tests/integration/auth/login-throttle-window.integration.test.ts`
- [ ] T040 [P] [US2] Add failing frontend unit test for invalid/throttled/unavailable error states in `frontend/tests/unit/login/login-error-states.test.ts`
- [ ] T041 [P] [US2] Add failing e2e test for invalid login and retry guidance in `frontend/tests/e2e/login/login-invalid.e2e.spec.ts`

### Implementation for User Story 2

- [ ] T042 [US2] Implement failed-login and throttle decision use case in `backend/src/business/auth/login-failure.use-case.ts`
- [ ] T043 [US2] Implement throttle persistence adapter in `backend/src/data/auth/login-throttle.repository.prisma.ts`
- [ ] T044 [US2] Implement explicit safe login error mapper in `backend/src/business/auth/login-error-mapper.ts`
- [ ] T045 [US2] Extend login controller for `401/429/503` outcomes in `backend/src/presentation/auth/login.controller.ts`
- [ ] T046 [US2] Implement frontend login error-state model in `frontend/src/business/login/login-error-state.ts`
- [ ] T047 [US2] Implement explicit retry-capable error rendering in `frontend/src/presentation/login/LoginPage.tsx`

**Checkpoint**: US2 is independently testable and complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification of compliance, traceability, and operational readiness.

- [ ] T048 [P] Verify OpenAPI response parity for `200/401/403/429/503` in `specs/003-user-login/contracts/user-login.openapi.yaml`
- [ ] T049 [P] Add release evidence test for at-rest protection sampling in `backend/tests/integration/auth/login-at-rest-evidence.integration.test.ts`
- [ ] T050 [P] Add release evidence test for transport rejection and no-plaintext findings in `backend/tests/integration/auth/login-security-evidence.integration.test.ts`
- [ ] T051 [P] Add operational backup/restore verification checklist for auth data in `infra/ops/recovery/login-auth-recovery-checklist.md`
- [ ] T052 [P] Add acceptance evidence capture task for SC-004 messaging clarity in `specs/003-user-login/quickstart.md`
- [ ] T053 Update requirement-to-test traceability matrix for UC-03 and AT-UC03-01/02 in `specs/003-user-login/quickstart.md`
- [ ] T054 [P] Add performance validation test for p95 <= 1.0s at 100 concurrent login attempts in `backend/tests/integration/auth/login-performance.integration.test.ts`
- [ ] T055 [P] Add explicit cross-browser validation checklist for Chrome and Firefox login flows in `frontend/tests/e2e/login/login-cross-browser-checklist.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; may proceed after US1 or in parallel except shared-file tasks.
- **Phase 5 (Polish)**: Depends on completion of US1 and US2.

### User Story Dependency Graph

- **US1**: Independent after foundational completion.
- **US2**: Independent after foundational completion, but tasks touching `backend/src/presentation/auth/login.controller.ts` and `frontend/src/presentation/login/LoginPage.tsx` must be sequenced.

### Within Each User Story

- Tests must be authored and confirmed failing before implementation tasks.
- Data, business, and presentation layers remain separate.
- Story completion requires passing contract, integration, and UI tests.

## Parallel Execution Examples

### User Story 1

- Execute T024, T025, T026, T027, and T028 in parallel.
- After failing tests, execute T029 and T033 in parallel, then sequence T030 -> T031 -> T032 and T034 -> T035.

### User Story 2

- Execute T036, T037, T038, T039, T040, and T041 in parallel.
- After failing tests, execute T042 and T043 in parallel, then sequence T044 -> T045 and T046 -> T047.

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1).
3. Validate success and role-mapping denial outcomes before broader rollout.

### Incremental Delivery

1. Complete foundational controls and security/reliability tests.
2. Deliver US1 and validate independently.
3. Deliver US2 and validate independently.
4. Complete Phase 5 cross-cutting verification.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. One developer leads backend auth flow while another leads frontend login UX and e2e coverage.
3. Coordinate merges for shared files referenced in dependency notes.

## Notes

- `[P]` tasks are parallel-safe only when files do not overlap.
- User story tasks use `[US1]` and `[US2]` labels; setup/foundational/polish tasks do not use story labels.
- Security, reliability, and constitutional compliance requirements take precedence over optimization tasks.
