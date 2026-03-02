# Tasks: Respond to Review Invitation

**Input**: Design documents from `/specs/008-review-invitation-response/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are REQUIRED for this feature by constitution, plan, and quickstart. Apply Red-Green-Refactor per story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature module structure and test harnesses for UC-08.

- [X] T001 Create backend module folders in `backend/src/presentation/review-invitations/`, `backend/src/business/review-invitations/`, and `backend/src/data/review-invitations/`
- [X] T002 Create frontend module folders in `frontend/src/presentation/review-invitations/`, `frontend/src/business/review-invitations/`, and `frontend/src/data/review-invitations/`
- [X] T003 [P] Register OpenAPI contract artifact path `specs/008-review-invitation-response/contracts/review-invitation-response.openapi.yaml` in `backend/package.json`
- [X] T004 [P] Create test suite placeholders in `backend/tests/contract/review-invitations/`, `backend/tests/integration/review-invitations/`, and `frontend/tests/e2e/review-invitations/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared prerequisites required by all user stories.

**⚠️ CRITICAL**: No user story implementation begins until this phase is complete.

- [X] T005 [P] Add failing integration test for invited-referee ownership enforcement baseline in `backend/tests/integration/review-invitations/invitationOwnership.foundation.integration.test.ts`
- [X] T006 [P] Add failing integration test for first-valid-response-wins conflict control baseline in `backend/tests/integration/review-invitations/firstResponseWins.foundation.integration.test.ts`
- [X] T007 [P] Add failing integration test for unresolved-on-recording-failure baseline in `backend/tests/integration/review-invitations/recordingFailurePending.foundation.integration.test.ts`
- [X] T008 [P] Add failing integration test for sensitive-data log redaction baseline in `backend/tests/integration/review-invitations/logRedaction.foundation.integration.test.ts`
- [X] T009 Create Prisma migration for invitation response attempt and related schema updates in `backend/prisma/migrations/*_review_invitation_response_uc08/migration.sql`
- [X] T010 Update Prisma schema for `ReviewInvitation`, `InvitationResponseAttempt`, and `RefereeAssignment` relations/enums in `backend/prisma/schema.prisma`
- [X] T011 [P] Implement shared validation schemas for invitation retrieval and response payloads in `backend/src/business/review-invitations/reviewInvitationSchemas.ts`
- [X] T012 [P] Implement invited-referee authorization guard helpers in `backend/src/security/reviewInvitationAuthorization.ts`
- [X] T013 Implement repository interfaces and transaction boundary contracts in `backend/src/data/review-invitations/ReviewInvitationRepository.ts`
- [X] T014 [P] Implement structured audit helper for invitation response outcomes in `backend/src/shared/audit/reviewInvitationAudit.ts`
- [X] T015 [P] Document backup/restore impact for new invitation response records in `infra/ops/backup-restore.md`

**Checkpoint**: Auth, validation, persistence, conflict control, audit, and backup foundations are ready.

---

## Phase 3: User Story 1 - Accept Invitation (Priority: P1) 🎯 MVP

**Goal**: Allow invited referee to accept a pending invitation, record acceptance, and create reviewer assignment.

**Independent Test**: For an invited referee with a pending invitation, submit ACCEPT and verify response is recorded, invitation resolves to ACCEPTED, assignment is created, and explicit confirmation is returned.

### Tests for User Story 1 (REQUIRED)

- [X] T016 [P] [US1] Add failing contract test for `GET /api/v1/review-invitations/{invitationId}` success and auth errors in `backend/tests/contract/review-invitations/getReviewInvitation.contract.test.ts`
- [X] T017 [P] [US1] Add failing contract test for ACCEPT response on `POST /api/v1/review-invitations/{invitationId}/response` in `backend/tests/contract/review-invitations/respondAccept.contract.test.ts`
- [X] T018 [P] [US1] Add failing integration test for successful acceptance with assignment creation in `backend/tests/integration/review-invitations/respondAccept.success.integration.test.ts`
- [X] T019 [P] [US1] Add failing integration test for invitation detail retrieval minimum fields in `backend/tests/integration/review-invitations/getInvitationDetails.integration.test.ts`
- [X] T020 [P] [US1] Add failing UI/e2e test for invitation accept flow confirmation in `frontend/tests/e2e/review-invitations/respondAccept.success.e2e.test.ts`

### Implementation for User Story 1

- [X] T021 [US1] Implement invitation detail retrieval use case in `backend/src/business/review-invitations/GetReviewInvitationUseCase.ts`
- [X] T022 [US1] Implement invitation response orchestration use case for ACCEPT decision in `backend/src/business/review-invitations/RespondToReviewInvitationUseCase.ts`
- [X] T023 [US1] Implement transactional repository logic for ACCEPT state and assignment creation in `backend/src/data/review-invitations/PrismaReviewInvitationRepository.ts`
- [X] T024 [US1] Implement invitation detail route handler in `backend/src/presentation/review-invitations/getReviewInvitationHandler.ts`
- [X] T025 [US1] Implement invitation response route handler for ACCEPT flow in `backend/src/presentation/review-invitations/postReviewInvitationResponseHandler.ts`
- [X] T026 [US1] Implement frontend invitation detail API client in `frontend/src/data/review-invitations/getReviewInvitationClient.ts`
- [X] T027 [US1] Implement frontend response submission API client in `frontend/src/data/review-invitations/postReviewInvitationResponseClient.ts`
- [X] T028 [US1] Implement frontend ACCEPT response action workflow in `frontend/src/business/review-invitations/respondToInvitationAction.ts`
- [X] T029 [US1] Implement invitation response panel accept UX in `frontend/src/presentation/review-invitations/ReviewInvitationResponsePanel.tsx`
- [X] T030 [US1] Emit accept-success audit event for invitation response in `backend/src/shared/audit/reviewInvitationAudit.ts`

**Checkpoint**: US1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Reject Invitation (Priority: P1)

**Goal**: Allow invited referee to reject a pending invitation, resolve invitation as rejected, and avoid reviewer assignment.

**Independent Test**: For an invited referee with a pending invitation, submit REJECT and verify response is recorded, invitation resolves to REJECTED, no assignment is created, and explicit confirmation is returned.

### Tests for User Story 2 (REQUIRED)

- [X] T031 [P] [US2] Add failing contract test for REJECT response on `POST /api/v1/review-invitations/{invitationId}/response` in `backend/tests/contract/review-invitations/respondReject.contract.test.ts`
- [X] T032 [P] [US2] Add failing integration test for successful rejection without assignment creation in `backend/tests/integration/review-invitations/respondReject.success.integration.test.ts`
- [X] T033 [P] [US2] Add failing integration test for pending-only validation error on resolved invitation in `backend/tests/integration/review-invitations/respondResolvedInvitation.integration.test.ts`
- [X] T034 [P] [US2] Add failing UI/e2e test for invitation reject flow confirmation in `frontend/tests/e2e/review-invitations/respondReject.success.e2e.test.ts`

### Implementation for User Story 2

- [X] T035 [US2] Implement REJECT decision branch in invitation response orchestration in `backend/src/business/review-invitations/RespondToReviewInvitationUseCase.ts`
- [X] T036 [US2] Implement repository mutation path for REJECT without assignment side effects in `backend/src/data/review-invitations/PrismaReviewInvitationRepository.ts`
- [X] T037 [US2] Implement resolved-invitation validation and error mapping in `backend/src/presentation/review-invitations/reviewInvitationErrorMapper.ts`
- [X] T038 [US2] Implement frontend REJECT response action workflow in `frontend/src/business/review-invitations/respondToInvitationAction.ts`
- [X] T039 [US2] Implement invitation response panel reject UX in `frontend/src/presentation/review-invitations/ReviewInvitationResponsePanel.tsx`
- [X] T040 [US2] Emit reject-success audit event for invitation response in `backend/src/shared/audit/reviewInvitationAudit.ts`

**Checkpoint**: US2 is fully functional and independently testable.

---

## Phase 5: User Story 3 - Preserve Unresolved State on Recording Failure (Priority: P2)

**Goal**: Ensure explicit failure feedback is shown and invitation remains pending with no assignment side effects when recording fails.

**Independent Test**: Under simulated persistence failure, submit response and verify failure message, unchanged pending invitation, and no created/retained assignment side effects.

### Tests for User Story 3 (REQUIRED)

- [X] T041 [P] [US3] Add failing contract test for `500 RESPONSE_RECORDING_FAILED` on response endpoint in `backend/tests/contract/review-invitations/respondRecordingFailure.contract.test.ts`
- [X] T042 [P] [US3] Add failing integration test for unresolved invitation state after recording failure in `backend/tests/integration/review-invitations/respondRecordingFailure.pending.integration.test.ts`
- [X] T043 [P] [US3] Add failing integration test for no assignment side effects on recording failure in `backend/tests/integration/review-invitations/respondRecordingFailure.noAssignment.integration.test.ts`
- [X] T044 [P] [US3] Add failing integration test for first-valid-response-wins conflict rejection in `backend/tests/integration/review-invitations/respondConflict.firstWins.integration.test.ts`
- [X] T045 [P] [US3] Add failing UI/e2e test for explicit response-recording failure feedback in `frontend/tests/e2e/review-invitations/respondRecordingFailure.e2e.test.ts`

### Implementation for User Story 3

- [X] T046 [US3] Implement recording-failure rollback safeguards and explicit failure outcomes in `backend/src/business/review-invitations/RespondToReviewInvitationUseCase.ts`
- [X] T047 [US3] Implement repository transaction failure handling that preserves pending invitation state in `backend/src/data/review-invitations/PrismaReviewInvitationRepository.ts`
- [X] T048 [US3] Implement first-valid-response-wins conflict detection and `409` mapping in `backend/src/presentation/review-invitations/reviewInvitationErrorMapper.ts`
- [X] T049 [US3] Implement frontend failure-state messaging workflow for recording errors in `frontend/src/business/review-invitations/respondToInvitationAction.ts`
- [X] T050 [US3] Implement UI rendering for unresolved-state failure message in `frontend/src/presentation/review-invitations/ReviewInvitationResponsePanel.tsx`
- [X] T051 [US3] Emit recording-failure and conflict-rejected audit events in `backend/src/shared/audit/reviewInvitationAudit.ts`

**Checkpoint**: US3 is fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening for security, reliability, observability, and release readiness.

- [X] T052 [P] Add failing integration test for unauthorized invitation access rejection in `backend/tests/integration/review-invitations/respondAuthorizationFailure.integration.test.ts`
- [X] T053 [P] Add failing integration test for TLS-only invitation response transport behavior in `backend/tests/integration/review-invitations/transportSecurity.integration.test.ts`
- [X] T054 Implement invitation route transport security enforcement in `backend/src/presentation/review-invitations/reviewInvitationRouteSecurity.ts`
- [X] T055 [P] Add failing integration test for encrypted-at-rest protection and backup coverage of response records in `backend/tests/integration/review-invitations/atRestProtection.integration.test.ts`
- [X] T056 Implement persistence and ops wiring for at-rest protection assertions in `backend/src/data/review-invitations/PrismaReviewInvitationRepository.ts` and `infra/ops/backup-restore.md`
- [X] T057 [P] Add integration test for sensitive-field log redaction across invitation response outcomes in `backend/tests/integration/review-invitations/securityRedaction.integration.test.ts`
- [X] T058 [P] Validate Chrome and Firefox invitation response flows in `frontend/tests/e2e/review-invitations/`
- [X] T059 Update invitation response operational runbook for conflict/failure handling in `infra/ops/incident-response.md`
- [X] T060 Maintain UC-08 and AT-UC08-01/02 traceability evidence in `specs/008-review-invitation-response/quickstart.md`

---

## Dependencies & Execution Order

### Story Dependency Graph

- Phase 2 (Foundational) -> US1 (Phase 3)
- Phase 2 (Foundational) -> US2 (Phase 4)
- Phase 2 (Foundational) -> US3 (Phase 5)
- US1 + US2 + US3 -> Phase 6 (Polish)

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Setup completion and blocks all user stories.
- **Phase 3 (US1)**: Depends on Foundational completion.
- **Phase 4 (US2)**: Depends on Foundational completion.
- **Phase 5 (US3)**: Depends on Foundational completion.
- **Phase 6 (Polish)**: Depends on completed story phases.

### Within Each User Story

- Tests MUST be written first and observed failing before implementation.
- Business, data, and presentation responsibilities MUST remain separated.
- Validation and explicit user-visible outcomes MUST be complete before story sign-off.

## Parallel Execution Examples

### User Story 1

- Run in parallel: `T016`, `T017`, `T018`, `T019`, `T020`.
- After use case scaffolding (`T021`, `T022`), run data/presentation tasks in parallel: `T023`, `T024`, `T025`.
- Run frontend tasks in parallel once contract is stable: `T026`, `T027`, `T028`, then complete `T029`.

### User Story 2

- Run in parallel: `T031`, `T032`, `T033`, `T034`.
- Run `T035` and `T037` in parallel, then complete `T036`, `T038`, `T039`, `T040`.

### User Story 3

- Run in parallel: `T041`, `T042`, `T043`, `T044`, `T045`.
- Run `T046` and `T048` in parallel, then complete `T047`, `T049`, `T050`, `T051`.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1) and validate independent tests.
4. Demo/deploy MVP invitation response acceptance path.

### Incremental Delivery

1. Deliver US1 acceptance flow.
2. Deliver US2 rejection flow.
3. Deliver US3 recording-failure preservation and conflict behavior.
4. Complete Phase 6 hardening before release.

### Parallel Team Strategy

1. Team completes Setup and Foundational phases together.
2. After Phase 2:
   - Engineer A: US1 API and data flow.
   - Engineer B: US2 rejection and messaging.
   - Engineer C: US3 failure/conflict and resiliency behavior.
3. Integrate only after each story independently passes required tests.

## Notes

- `[P]` tasks are parallelizable when they touch different files and have no unmet prerequisites.
- Story labels are used only for user-story phase tasks.
- Every task includes an explicit file path and actionable scope.
