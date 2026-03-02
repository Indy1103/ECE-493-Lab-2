# Quickstart: Respond to Review Invitation (UC-08)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.
- Seed data includes registered referees and pending review invitations tied to papers.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC08-01` and `AT-UC08-02`.
2. Add failing integration tests for:
   - invited-referee-only access control,
   - retrieval of minimum required invitation details,
   - successful acceptance with assignment creation,
   - successful rejection with no assignment creation,
   - response-recording failure preserving pending invitation and no assignment side effects,
   - first-valid-response-wins under near-simultaneous submissions.
3. Implement presentation-layer endpoints using `contracts/review-invitation-response.openapi.yaml`.
4. Implement business-layer invitation response rules (pending-only response, ownership checks, deterministic conflict handling).
5. Implement data-layer transactional persistence for invitation status, response attempts, and acceptance-triggered assignments.
6. Implement structured audit logging for response success/failure/conflict outcomes without sensitive payload leakage.
7. Run full test and lint checks.

## Verification Commands

1. `npm run lint -w backend`
2. `npm run lint -w frontend`
3. `npm run lint:contracts:review-invitations -w backend`
4. `npm run test -w backend`
5. `npm run coverage -w backend`

## Evidence Links

- Contract tests:
  - `backend/tests/contract/review-invitations/getReviewInvitation.contract.test.ts`
  - `backend/tests/contract/review-invitations/respondAccept.contract.test.ts`
  - `backend/tests/contract/review-invitations/respondReject.contract.test.ts`
  - `backend/tests/contract/review-invitations/respondRecordingFailure.contract.test.ts`
- Integration tests:
  - `backend/tests/integration/review-invitations/invitationOwnership.foundation.integration.test.ts`
  - `backend/tests/integration/review-invitations/firstResponseWins.foundation.integration.test.ts`
  - `backend/tests/integration/review-invitations/recordingFailurePending.foundation.integration.test.ts`
  - `backend/tests/integration/review-invitations/logRedaction.foundation.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondAccept.success.integration.test.ts`
  - `backend/tests/integration/review-invitations/getInvitationDetails.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondReject.success.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondResolvedInvitation.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondRecordingFailure.pending.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondRecordingFailure.noAssignment.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondConflict.firstWins.integration.test.ts`
  - `backend/tests/integration/review-invitations/respondAuthorizationFailure.integration.test.ts`
  - `backend/tests/integration/review-invitations/transportSecurity.integration.test.ts`
  - `backend/tests/integration/review-invitations/atRestProtection.integration.test.ts`
  - `backend/tests/integration/review-invitations/securityRedaction.integration.test.ts`
- Unit tests:
  - `backend/tests/unit/reviewInvitationSupport.unit.test.ts`
- Frontend e2e specs:
  - `frontend/tests/e2e/review-invitations/`
- Browser evidence checklist:
  - `frontend/tests/e2e/review-invitations/browser-validation.md`

## Validation Checklist

- Invited referee can accept pending invitation and receives explicit confirmation.
- Acceptance creates reviewer assignment for the invited paper.
- Invited referee can reject pending invitation and remains unassigned.
- Non-invited users and unauthenticated users are rejected explicitly.
- Failed recording attempts leave invitation pending and produce no assignment side effects.
- Near-simultaneous responses on one invitation preserve first-valid-response-wins state.
- No sensitive reviewer data appears in plaintext logs or error payloads.

## Traceability Matrix

| Requirement / Test Objective | Primary Tests |
|---|---|
| AT-UC08-01 invitation acceptance path | `respondAccept.success.integration.test.ts`, `respondAccept.contract.test.ts` |
| AT-UC08-02 invitation rejection path | `respondReject.success.integration.test.ts`, `respondReject.contract.test.ts` |
| First-valid-response-wins conflict handling (FR-012/RAR-001) | `firstResponseWins.foundation.integration.test.ts`, `respondConflict.firstWins.integration.test.ts` |
| Unresolved state on recording failure (FR-011/RAR-005) | `recordingFailurePending.foundation.integration.test.ts`, `respondRecordingFailure.pending.integration.test.ts`, `respondRecordingFailure.noAssignment.integration.test.ts`, `respondRecordingFailure.contract.test.ts` |
| Invited-referee authorization only (FR-010/SPR-004) | `invitationOwnership.foundation.integration.test.ts`, `respondAuthorizationFailure.integration.test.ts`, `getReviewInvitation.contract.test.ts` |
| Transport security (SPR-001) | `transportSecurity.integration.test.ts` |
| At-rest protection and backup coverage (SPR-002/RAR-004) | `atRestProtection.integration.test.ts`, `infra/ops/backup-restore.md` |
| Sensitive-data-safe logs and payloads (SPR-003) | `logRedaction.foundation.integration.test.ts`, `securityRedaction.integration.test.ts`, `reviewInvitationSupport.unit.test.ts` |
