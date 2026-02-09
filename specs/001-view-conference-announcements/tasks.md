# Tasks: Public Conference Announcement Access

**Input**: Design documents from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/001-view-conference-announcements/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. For every user story, write tests first and verify they fail before implementation (Red-Green-Refactor).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while preserving constitutional constraints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`, `infra/`
- **Backend layers**: `presentation/`, `business/`, `data/`
- **Frontend layers**: `presentation/`, `business/`, `data/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize repository scaffolding and baseline tooling for the three-layer web app.

- [ ] T001 Create root workspace scripts for lint and test execution in `package.json`
- [ ] T002 Create backend TypeScript project configuration in `backend/package.json` and `backend/tsconfig.json`
- [ ] T003 [P] Create frontend TypeScript project configuration in `frontend/package.json` and `frontend/tsconfig.json`
- [ ] T004 [P] Scaffold layer directories with placeholders in `backend/src/presentation/.gitkeep`, `backend/src/business/.gitkeep`, `backend/src/data/.gitkeep`, `frontend/src/presentation/.gitkeep`, `frontend/src/business/.gitkeep`, and `frontend/src/data/.gitkeep`
- [ ] T005 [P] Add baseline CI pipeline for lint and tests in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared data, contract, observability, and routing foundations that block all stories.

**CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational Rules (REQUIRED BEFORE PHASE 2 IMPLEMENTATION)

- [ ] T042 Add failing unit test for visibility-window rule behavior in `backend/tests/unit/publicAnnouncementEligibility.unit.test.ts`
- [ ] T043 Add failing integration test for unauthenticated route shell and `requestId` propagation in `backend/tests/integration/public-announcements.route-foundation.integration.test.ts`
- [ ] T044 Add failing integration test for retrieval-failure observability contract (log + metric) in `backend/tests/integration/public-announcements.observability-foundation.integration.test.ts`

- [ ] T006 Define `ConferenceAnnouncement` model and datasource settings in `backend/prisma/schema.prisma`
- [ ] T007 Create initial SQL migration for public announcements in `infra/db/migrations/001_public_announcements_init.sql`
- [ ] T008 Define repository port interface in `backend/src/business/ports/conferenceAnnouncementRepository.ts`
- [ ] T009 [P] Implement Prisma repository adapter scaffold in `backend/src/data/prismaConferenceAnnouncementRepository.ts`
- [ ] T010 Implement authoritative visibility-window rules in `backend/src/business/rules/publicAnnouncementEligibility.ts`
- [ ] T011 [P] Define response and error Zod schemas in `backend/src/shared/contracts/publicAnnouncementsSchemas.ts`
- [ ] T012 [P] Bootstrap Fastify server with request-id and structured logging in `backend/src/presentation/http/server.ts`
- [ ] T013 Implement Prometheus retrieval-failure metric registration in `backend/src/shared/observability/announcementMetrics.ts`
- [ ] T014 Configure alert rule for failure rate >5% for 5 minutes in `infra/ops/monitoring/public-announcements-alert.rules.yml`
- [ ] T015 Register unauthenticated public announcements route shell in `backend/src/presentation/routes/publicAnnouncementsRoute.ts`

**Checkpoint**: Foundation ready; user-story implementation can begin.

---

## Phase 3: User Story 1 - Read Available Announcements (Priority: P1) 🎯 MVP

**Goal**: Anonymous users can view and read all currently eligible public conference announcements.

**Independent Test**: With at least one available conference announcement, anonymous access to the public entry point shows readable announcement content with no login prompt.

### Tests for User Story 1 (REQUIRED)

- [ ] T016 [P] [US1] Add contract test for `200 AVAILABLE` response in `backend/tests/contract/public-announcements.available.contract.test.ts`
- [ ] T017 [P] [US1] Add integration test for visibility-window filtering in `backend/tests/integration/public-announcements.available.integration.test.ts`
- [ ] T018 [P] [US1] Add e2e test for anonymous readable announcements in `frontend/tests/e2e/public-announcements.available.e2e.spec.ts`

### Implementation for User Story 1

- [ ] T019 [US1] Implement eligible-announcement query (`is_public` + publish window) in `backend/src/data/prismaConferenceAnnouncementRepository.ts`
- [ ] T020 [US1] Implement service mapping for `AVAILABLE` state in `backend/src/business/services/publicAnnouncementService.ts`
- [ ] T021 [US1] Implement GET handler success path for available announcements in `backend/src/presentation/routes/publicAnnouncementsRoute.ts`
- [ ] T022 [US1] Implement public announcements API client in `frontend/src/data/publicAnnouncementsApi.ts`
- [ ] T023 [US1] Implement frontend business orchestration for anonymous fetch in `frontend/src/business/loadPublicAnnouncements.ts`
- [ ] T024 [US1] Render available announcement list without authentication prompts in `frontend/src/presentation/pages/PublicAnnouncementsPage.tsx`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Receive Clear Empty-State Message (Priority: P1)

**Goal**: Anonymous users receive clear deterministic messaging when no announcements are available or retrieval fails.

**Independent Test**: With no eligible announcements, anonymous access shows the explicit empty-state message and no announcement content; simulated retrieval failure shows a distinct explicit error message.

### Tests for User Story 2 (REQUIRED)

- [ ] T025 [P] [US2] Add contract test for `200 EMPTY` response in `backend/tests/contract/public-announcements.empty.contract.test.ts`
- [ ] T026 [P] [US2] Add integration test for empty retrieval outcome in `backend/tests/integration/public-announcements.empty.integration.test.ts`
- [ ] T027 [P] [US2] Add integration test for `503 ANNOUNCEMENTS_UNAVAILABLE` response in `backend/tests/integration/public-announcements.failure.integration.test.ts`
- [ ] T028 [P] [US2] Add e2e test for empty-state message with zero entries in `frontend/tests/e2e/public-announcements.empty.e2e.spec.ts`
- [ ] T029 [P] [US2] Add e2e test for retrieval-failure message distinct from empty state in `frontend/tests/e2e/public-announcements.failure.e2e.spec.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Extend service to produce deterministic `EMPTY` and `RETRIEVAL_FAILURE` states in `backend/src/business/services/publicAnnouncementService.ts`
- [ ] T031 [US2] Return `503` error payload with `requestId` in `backend/src/presentation/routes/publicAnnouncementsRoute.ts`
- [ ] T032 [US2] Emit structured retrieval-failure logs with failure category in `backend/src/presentation/routes/publicAnnouncementsRoute.ts`
- [ ] T033 [US2] Increment retrieval-failure metrics on error path in `backend/src/shared/observability/announcementMetrics.ts`
- [ ] T034 [US2] Render explicit empty-state message and suppress announcement list in `frontend/src/presentation/pages/PublicAnnouncementsPage.tsx`
- [ ] T035 [US2] Render explicit retrieval-failure message distinct from empty-state text in `frontend/src/presentation/pages/PublicAnnouncementsPage.tsx`

**Checkpoint**: User Stories 1 and 2 both pass independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Complete performance, browser, resilience, and traceability requirements before release.

- [ ] T036 [P] Add 100-concurrent-user p95 performance test for public announcements in `backend/tests/performance/public-announcements.k6.js`
- [ ] T037 [P] Add CI job executing announcement performance smoke checks in `.github/workflows/ci.yml`
- [ ] T038 Add Chrome and Firefox e2e matrix for announcement flows in `.github/workflows/ci.yml`
- [ ] T039 Update announcement incident and alert response runbook in `infra/ops/monitoring/public-announcements-runbook.md`
- [ ] T040 Validate and document backup/restore verification for announcements data in `infra/db/backup/restore-verification.md`
- [ ] T041 Record UC-01 and AT-UC01 traceability checks in `specs/001-view-conference-announcements/quickstart.md`
- [ ] T045 [P] Add responsive e2e viewport tests (mobile + desktop) for AVAILABLE/EMPTY/RETRIEVAL_FAILURE states in `frontend/tests/e2e/public-announcements.responsive.e2e.spec.ts`
- [ ] T046 Add CI step to run responsive viewport checks in `.github/workflows/ci.yml`
- [ ] T047 Enforce HTTPS-only access policy for public announcements endpoint in `backend/src/presentation/http/server.ts` and `infra/ops/monitoring/public-announcements-https-policy.md`
- [ ] T048 [P] Add integration test for non-TLS request context handling in `backend/tests/integration/public-announcements.tls.integration.test.ts`
- [ ] T049 Define public announcements availability SLI/SLO and alerts in `infra/ops/monitoring/public-announcements-slo.yml`
- [ ] T050 [P] Add synthetic availability probe configuration for public announcements in `infra/ops/monitoring/public-announcements-availability-probe.yml`
- [ ] T051 Add integration test validating automatic recovery from transient retrieval failures to normal read states in `backend/tests/integration/public-announcements.recovery.integration.test.ts`
- [ ] T052 [P] Add fault-injection scenario for retrieval outage and recovery timing in `backend/tests/integration/public-announcements.fault-recovery.integration.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Setup and blocks all user stories.
- Within Phase 2, T042-T044 MUST execute first and fail before T006-T015 implementation begins.
- User Story 1 (Phase 3) and User Story 2 (Phase 4) both depend on Foundational completion.
- Polish (Phase 5) depends on completion of both user stories.

### User Story Dependencies

- US1 depends only on Phase 2 and is the recommended MVP.
- US2 depends on Phase 2 and can run after US1 or in parallel on a separate branch once shared files are coordinated.

### Within Each User Story

- Tests are written first and verified failing before implementation.
- Data/business/presentation layering is preserved to match architectural constraints.
- Story is considered complete only when contract, integration, and e2e tests pass.

## Parallel Execution Examples

### User Story 1

Run in parallel after Phase 2:
- T016, T017, T018

Then implement in sequence:
- T019 -> T020 -> T021 -> T022 -> T023 -> T024

### User Story 2

Run in parallel after Phase 2:
- T025, T026, T027, T028, T029

Then implement in sequence:
- T030 -> T031 -> T032 and T033 (parallel) -> T034 -> T035

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and validate independently.
3. Demo/deploy MVP behavior for available announcements.

### Incremental Delivery

1. Complete US1 for available-announcement behavior.
2. Complete US2 for empty/failure deterministic behavior.
3. Complete Phase 5 hardening and release checks.

### Parallel Team Strategy

1. Team completes Phase 1 and Phase 2 together.
2. One developer owns US1 while another prepares US2 tests in parallel after foundational completion.
3. Merge when each story independently passes test gates.

## Notes

- Tasks marked `[P]` are parallelizable when they do not edit the same files.
- Task-to-story mapping is explicit through `[US1]` and `[US2]` labels.
- Public endpoint behavior remains unauthenticated and read-only by design.
