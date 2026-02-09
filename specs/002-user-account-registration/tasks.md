# Tasks: User Account Registration

**Input**: Design documents from `/specs/002-user-account-registration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. For every user story, write tests first and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `infra/`
- **Backend layers**: `presentation/`, `business/`, `data/`
- **Frontend layers**: `presentation/`, `business/`, `data/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize project scaffolding and quality tooling

- [ ] T001 Create layered backend/frontend/infra scaffolding in `backend/src/`, `frontend/src/`, `infra/`, `backend/tests/`, and `frontend/tests/`
- [ ] T002 Initialize backend TypeScript project configuration in `backend/package.json` and `backend/tsconfig.json`
- [ ] T003 Initialize frontend React TypeScript project configuration in `frontend/package.json` and `frontend/tsconfig.json`
- [ ] T004 Configure root quality gates in `package.json`, `eslint.config.js`, and `.prettierrc`
- [ ] T005 [P] Configure backend test runners in `backend/tests/unit/`, `backend/tests/integration/`, and `backend/tests/contract/`
- [ ] T006 [P] Configure frontend test runners and e2e setup in `frontend/tests/unit/`, `frontend/tests/integration/`, and `frontend/tests/e2e/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Foundational Tests (REQUIRED) ⚠️

- [ ] T007 Establish pre-implementation requirement traceability baseline in `specs/002-user-account-registration/traceability.md`
- [ ] T008 [P] Add failing foundational security tests for TLS enforcement and plaintext protection in `backend/tests/integration/security/registrationFoundationSecurity.spec.ts`
- [ ] T009 [P] Add failing foundational reliability tests for concurrency safety and deterministic outcomes in `backend/tests/integration/reliability/registrationFoundationReliability.spec.ts`
- [ ] T010 [P] Add failing foundational observability tests for request IDs and outcome telemetry in `backend/tests/integration/observability/registrationFoundationObservability.spec.ts`

### Foundational Implementation

- [ ] T011 Define persistence schema and migration for user accounts and throttle records in `backend/src/data/prisma/schema.prisma` and `infra/db/migrations/`
- [ ] T012 Create shared registration outcome/error contracts in `backend/src/shared/contracts/registrationOutcome.ts`
- [ ] T013 Implement request-context and structured logger bootstrap in `backend/src/shared/observability/requestContext.ts` and `backend/src/shared/observability/logger.ts`
- [ ] T014 [P] Implement registration metrics scaffolding in `backend/src/shared/observability/registrationMetrics.ts`
- [ ] T015 Implement password hashing and sensitive-data redaction helpers in `backend/src/security/passwordHasher.ts` and `backend/src/security/sensitiveDataPolicy.ts`
- [ ] T016 Implement throttling policy service in `backend/src/business/registration/registrationThrottleService.ts`
- [ ] T017 Implement transport-security guard for registration routes in `backend/src/presentation/middleware/transportSecurityGuard.ts`
- [ ] T018 [P] Add backup and restore scaffolding in `infra/backup/register-account-backup.sh` and `infra/ops/recovery/restore-account-backup.sh`
- [ ] T019 Implement public-route and default-role policy in `backend/src/presentation/routes/publicRoutePolicy.ts` and `backend/src/business/registration/defaultRolePolicy.ts`
- [ ] T020 Implement registration workflow skeleton interfaces in `backend/src/presentation/routes/publicRegistrationRoute.ts`, `backend/src/business/registration/registerUser.ts`, and `backend/src/data/repositories/userAccountRepository.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Successful Account Registration (Priority: P1) 🎯 MVP

**Goal**: Allow an unauthenticated user with valid and unique information to create an account and receive login-ready confirmation.

**Independent Test**: Submit valid `fullName`, `email`, and `password` to `POST /api/public/registrations` and verify `201 REGISTERED`, success messaging, and immediate login eligibility.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T021 [P] [US1] Add failing contract test for `201 REGISTERED` in `backend/tests/contract/publicRegistration.contract.spec.ts`
- [ ] T022 [P] [US1] Add failing integration test for successful account creation and login eligibility in `backend/tests/integration/registration/registrationSuccess.spec.ts`
- [ ] T023 [P] [US1] Add failing browser e2e success-flow test (Chrome + Firefox) in `frontend/tests/e2e/registration-success.spec.ts`

### Implementation for User Story 1

- [ ] T024 [US1] Implement registration request schema and success response mapping in `backend/src/presentation/registration/registrationSchemas.ts`
- [ ] T025 [US1] Implement `REGISTERED` orchestration flow in `backend/src/business/registration/registerUser.ts`
- [ ] T026 [US1] Implement user-account create persistence with normalized/original email fields in `backend/src/data/repositories/userAccountRepository.ts`
- [ ] T027 [US1] Wire `201` success response in `backend/src/presentation/routes/publicRegistrationRoute.ts`
- [ ] T028 [US1] Implement successful submission UI and login-ready confirmation in `frontend/src/presentation/pages/RegisterPage.tsx`
- [ ] T029 [US1] Emit `REGISTERED` audit log and metrics events in `backend/src/shared/observability/registrationTelemetry.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Invalid or Incomplete Registration Data Handling (Priority: P1)

**Goal**: Provide explicit corrective feedback for invalid/incomplete submissions and enforce temporary throttling with clear retry guidance.

**Independent Test**: Submit invalid or incomplete inputs and verify `400 VALIDATION_FAILED` with field-level feedback; exceed failed-attempt threshold and verify `429 REGISTRATION_THROTTLED` with cooldown messaging.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T030 [P] [US2] Add failing contract tests for `400 VALIDATION_FAILED` and `429 REGISTRATION_THROTTLED` in `backend/tests/contract/publicRegistration.contract.spec.ts`
- [ ] T031 [P] [US2] Add failing integration tests for validation rules and throttling windows in `backend/tests/integration/registration/registrationValidationAndThrottle.spec.ts`
- [ ] T032 [P] [US2] Add failing browser e2e validation and throttling feedback test in `frontend/tests/e2e/registration-validation.spec.ts`

### Implementation for User Story 2

- [ ] T033 [US2] Implement field-level validation error mapper in `backend/src/business/registration/validationErrorMapper.ts`
- [ ] T034 [US2] Implement `VALIDATION_FAILED` flow in `backend/src/business/registration/registerUser.ts`
- [ ] T035 [US2] Implement failed-attempt persistence and cooldown enforcement in `backend/src/data/repositories/registrationThrottleRepository.ts`
- [ ] T036 [US2] Wire explicit `400` and `429` payloads in `backend/src/presentation/routes/publicRegistrationRoute.ts`
- [ ] T037 [US2] Implement invalid-input and throttling feedback states in `frontend/src/presentation/pages/RegisterPage.tsx`
- [ ] T038 [US2] Implement secure operational failure message catalog in `backend/src/presentation/registration/errorMessageCatalog.ts`
- [ ] T039 [US2] Emit `VALIDATION_FAILED`, `THROTTLED`, and `PROCESSING_FAILURE` audit/metric events in `backend/src/shared/observability/registrationTelemetry.ts`

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: User Story 3 - Duplicate Email Handling (Priority: P1)

**Goal**: Prevent duplicate account creation using normalized email comparison and provide clear duplicate-email retry messaging.

**Independent Test**: Submit registration with an existing email (including case/whitespace variants) and verify `409 EMAIL_ALREADY_REGISTERED` plus retry guidance.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T040 [P] [US3] Add failing contract test for `409 EMAIL_ALREADY_REGISTERED` in `backend/tests/contract/publicRegistration.contract.spec.ts`
- [ ] T041 [P] [US3] Add failing integration tests for normalized duplicate-email detection in `backend/tests/integration/registration/registrationDuplicateEmail.spec.ts`
- [ ] T042 [P] [US3] Add failing browser e2e duplicate-email path test in `frontend/tests/e2e/registration-duplicate-email.spec.ts`

### Implementation for User Story 3

- [ ] T043 [US3] Add normalized-email utility in `backend/src/business/registration/emailNormalization.ts`
- [ ] T044 [US3] Implement duplicate-email lookup guard in `backend/src/data/repositories/userAccountRepository.ts`
- [ ] T045 [US3] Implement `DUPLICATE_EMAIL` flow in `backend/src/business/registration/registerUser.ts`
- [ ] T046 [US3] Wire `409` duplicate-email payload in `backend/src/presentation/routes/publicRegistrationRoute.ts`
- [ ] T047 [US3] Implement duplicate-email UI messaging and retry state in `frontend/src/presentation/pages/RegisterPage.tsx`
- [ ] T048 [US3] Emit `DUPLICATE_EMAIL` audit and metrics events in `backend/src/shared/observability/registrationTelemetry.ts`

**Checkpoint**: User Story 3 is fully functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-cutting hardening and release evidence

- [ ] T049 [P] Add failing contract/integration tests for `503 REGISTRATION_UNAVAILABLE` and request-id correlation in `backend/tests/contract/publicRegistration.contract.spec.ts` and `backend/tests/integration/registration/registrationFailure.spec.ts`
- [ ] T050 [P] Execute registration performance run for `p95 <= 1.5s` (50 concurrent attempts) and capture evidence in `infra/ops/monitoring/registration-load.report.md`
- [ ] T051 [P] Perform backup/restore drill and capture evidence in `infra/ops/recovery/registration-restore-drill.md`
- [ ] T052 Finalize requirement-to-test traceability mappings in `specs/002-user-account-registration/traceability.md`
- [ ] T053 Verify full test/lint gate (`npm test && npm run lint`) and record release readiness in `specs/002-user-account-registration/checklists/release-readiness.md`
- [ ] T054 [P] Record cross-browser execution evidence for Chrome and Firefox in `frontend/tests/e2e/browser-compatibility-report.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: Depend on Foundational completion; US1, US2, and US3 can proceed independently after Phase 2
- **Polish (Phase 6)**: Depends on completion of all user-story phases

### User Story Dependency Graph

- **US1**: Depends on Phase 2 only
- **US2**: Depends on Phase 2 only
- **US3**: Depends on Phase 2 only
- **Graph**: `Phase 1 -> Phase 2 -> (US1 || US2 || US3) -> Phase 6`

### Within Each User Story

- Tests MUST be written first and observed failing before implementation
- Implementation must respect presentation/business/data layer boundaries
- Validation and explicit user-visible error messaging must be completed before sign-off
- Audit logging and metrics updates must cover all outcomes introduced by the story
- Story must pass contract, integration, and browser checks before completion

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- Test creation tasks within each story can run in parallel
- After Phase 2 completion, separate developers can execute US1/US2/US3 in parallel

---

## Parallel Example: User Story 1

```bash
Task: "T021 [US1] Add failing contract success test"
Task: "T022 [US1] Add failing integration success test"
Task: "T023 [US1] Add failing e2e success test"
```

## Parallel Example: User Story 2

```bash
Task: "T030 [US2] Add failing contract validation/throttle tests"
Task: "T031 [US2] Add failing integration validation/throttle tests"
Task: "T032 [US2] Add failing e2e validation/throttle tests"
```

## Parallel Example: User Story 3

```bash
Task: "T040 [US3] Add failing contract duplicate-email test"
Task: "T041 [US3] Add failing integration duplicate-email test"
Task: "T042 [US3] Add failing e2e duplicate-email test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate US1 tests and foundational security/reliability controls
5. Demo/deploy MVP registration flow

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver US1 and validate independently
3. Deliver US2 and validate independently
4. Deliver US3 and validate independently
5. Complete Phase 6 hardening and release evidence

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. After Phase 2:
   - Developer A: US1
   - Developer B: US2
   - Developer C: US3
3. Integrate only after each story independently passes required checks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Every story is independently completable and testable after Phase 2
- Security, reliability, and explicit error communication are release gates
