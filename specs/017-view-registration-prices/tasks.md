---

description: "Task list for View Registration Prices"
---

# Tasks: View Registration Prices

**Input**: Design documents from `/specs/017-view-registration-prices/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are REQUIRED by the Constitution. For every user story, write tests first
and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `infra/`
- **Backend layers**: `presentation/`, `business/`, `data/`
- **Frontend layers**: `presentation/`, `business/`, `data/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize feature scaffolding and data storage foundation

- [ ] T001 Create migration for registration price list tables in `infra/db/migrations/017_create_registration_price_lists.sql`
- [ ] T002 [P] Add Prisma models for `RegistrationPriceList` and `RegistrationPrice` in `backend/src/data/prisma/schema.prisma`
- [ ] T003 [P] Add API contract baseline for public prices in `specs/017-view-registration-prices/contracts/openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core controls that MUST be complete before user-story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define public route registration entry point in `backend/src/presentation/routes/publicRoutes.ts`
- [ ] T005 [P] Define service interface for price list retrieval in `backend/src/business/services/registrationPriceService.ts`
- [ ] T006 [P] Define repository interface for price list access in `backend/src/data/repositories/registrationPriceRepository.ts`
- [ ] T007 Establish error response shape for public endpoints in `backend/src/presentation/http/errorResponses.ts`
- [ ] T008 [P] Add frontend API client wrapper for public endpoints in `frontend/src/data/api/publicClient.ts`
- [ ] T009 Ensure public route is unauthenticated in `backend/src/presentation/middleware/auth.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Published Prices (Priority: P1) 🎯 MVP

**Goal**: Attendees can request and view the published registration price list with multiple attendance options.

**Independent Test**: With a published list in the database, request prices and confirm the list renders with multiple attendance options.

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T010 [P] [US1] Add contract test for GET `/public/registration-prices` 200 in `backend/tests/contract/publicRegistrationPrices.test.ts`
- [ ] T011 [P] [US1] Add integration test for published list retrieval in `backend/tests/integration/registrationPriceService.test.ts`
- [ ] T012 [P] [US1] Add UI/e2e test for price list display in `frontend/tests/e2e/registrationPrices.view.spec.ts`

### Implementation for User Story 1

- [ ] T013 [US1] Implement backend route handler for published list in `backend/src/presentation/controllers/publicRegistrationPricesController.ts`
- [ ] T014 [US1] Implement business workflow to fetch published list in `backend/src/business/services/registrationPriceService.ts`
- [ ] T015 [US1] Implement repository query for published list and prices in `backend/src/data/repositories/registrationPriceRepository.ts`
- [ ] T016 [US1] Implement frontend API call for published list in `frontend/src/data/api/registrationPrices.ts`
- [ ] T017 [US1] Implement price list UI view in `frontend/src/presentation/pages/RegistrationPricesPage.tsx`
- [ ] T018 [US1] Add explicit validation of published list shape in `backend/src/business/validation/registrationPriceValidation.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Prices Unavailable (Priority: P2)

**Goal**: Attendees receive an explicit unavailability message when no price list is published.

**Independent Test**: With no published list, request prices and confirm an unavailability message is shown and no prices render.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T019 [P] [US2] Add contract test for GET `/public/registration-prices` 404 in `backend/tests/contract/publicRegistrationPrices.test.ts`
- [ ] T020 [P] [US2] Add integration test for unavailable list path in `backend/tests/integration/registrationPriceService.test.ts`
- [ ] T021 [P] [US2] Add UI/e2e test for unavailability message in `frontend/tests/e2e/registrationPrices.unavailable.spec.ts`

### Implementation for User Story 2

- [ ] T022 [US2] Implement 404 response mapping in `backend/src/presentation/controllers/publicRegistrationPricesController.ts`
- [ ] T023 [US2] Implement service-level unavailable handling in `backend/src/business/services/registrationPriceService.ts`
- [ ] T024 [US2] Implement repository null handling in `backend/src/data/repositories/registrationPriceRepository.ts`
- [ ] T025 [US2] Implement UI empty-state messaging in `frontend/src/presentation/pages/RegistrationPricesPage.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: Reliability, Security, and Operational Hardening

**Purpose**: Cross-cutting controls required before release

- [ ] T026 [P] Verify backup/restore impact for price list tables in `infra/db/backup/restore-verification.md`
- [ ] T027 [P] Execute concurrency test for public price retrieval in `backend/tests/integration/registrationPriceConcurrency.test.ts`
- [ ] T028 [P] Verify Chrome and Firefox behavior for prices page in `frontend/tests/e2e/registrationPrices.browser.spec.ts`
- [ ] T029 [P] Validate no plaintext sensitive data in logs for this feature in `backend/tests/integration/registrationPriceLogging.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion; can proceed by priority
- **Hardening (Phase 5)**: Depends on all implemented user stories

### Within Each User Story

- Tests MUST be written first and observed failing before implementation
- Presentation/business/data layer tasks MUST remain separated
- Validation and explicit error messaging MUST be implemented before story sign-off
- Story must pass all tests before moving to next priority

### Parallel Opportunities

- Tasks marked **[P]** can run in parallel when they do not modify the same files
- Test creation tasks within a story can run in parallel

---

## Parallel Example: User Story 1

```bash
# Create tests in parallel (all should fail before implementation)
Task: "Add contract test for GET /public/registration-prices 200"
Task: "Add integration test for published list retrieval"
Task: "Add UI/e2e test for price list display"

# Then implement each layer with clear boundaries
Task: "Implement backend route handler for published list"
Task: "Implement business workflow to fetch published list"
Task: "Implement repository query for published list and prices"
Task: "Implement frontend API call for published list"
Task: "Implement price list UI view"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate tests, security constraints, and browser compatibility for User Story 1
5. Demo if ready

### Incremental Delivery

1. Complete Setup + Foundational
2. Deliver User Story 1 and validate independently
3. Deliver User Story 2 and validate independently
4. Execute hardening phase before release

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Every story must remain independently completable and testable
- Reliability, confidentiality, and integrity are higher priority than optimization
