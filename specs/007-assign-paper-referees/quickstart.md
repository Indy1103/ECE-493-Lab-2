# Quickstart: Assign Referees to Submitted Papers (UC-07)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.
- Seed data includes at least one editor, submitted paper in awaiting-assignment state, and referees with varied workloads.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC07-01`, `AT-UC07-02`, and `AT-UC07-03`.
2. Add failing integration tests for:
   - unauthenticated/expired-session assignment rejection,
   - non-editor authorization rejection,
   - duplicate referee IDs rejected atomically,
   - workload-limit violation rejected with no assignment persisted,
   - paper-capacity violation rejected with no assignment persisted,
   - successful atomic assignment + invitation intent creation,
   - concurrent same-paper assignment requests serialized,
   - invitation dispatch failure does not roll back persisted assignments and returns retryable status.
3. Implement presentation-layer endpoints using `contracts/referee-assignments.openapi.yaml`.
4. Implement business-layer policy validation (capacity, workload, duplicate detection, atomic all-or-nothing behavior).
5. Implement data-layer transactional persistence and per-paper serialization lock.
6. Implement invitation dispatch worker/path with retryable failure statuses and explicit operational feedback.
7. Add structured assignment/invitation audit logging without sensitive referee data leakage.
8. Run full test and lint checks.

## Verification Commands

1. `npm run lint -w backend`
2. `npm run lint -w frontend`
3. `npm run lint:contracts:referee-assignments -w backend`
4. `npm run test -w backend`
5. `npm run coverage -w backend`

## Evidence Links

- Contract tests:
  - `backend/tests/contract/referee-assignments/getAssignmentOptions.contract.test.ts`
  - `backend/tests/contract/referee-assignments/postAssignments.contract.test.ts`
  - `backend/tests/contract/referee-assignments/workloadViolation.contract.test.ts`
  - `backend/tests/contract/referee-assignments/paperCapacityViolation.contract.test.ts`
- Integration tests:
  - `backend/tests/integration/referee-assignments/editorAuth.foundation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/perPaperSerialization.foundation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/duplicateAtomicity.foundation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/logRedaction.foundation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/assignReferees.success.integration.test.ts`
  - `backend/tests/integration/referee-assignments/invitationNonRollback.integration.test.ts`
  - `backend/tests/integration/referee-assignments/workloadViolation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/workloadRetry.integration.test.ts`
  - `backend/tests/integration/referee-assignments/paperCapacityViolation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/paperCapacityConcurrency.integration.test.ts`
  - `backend/tests/integration/referee-assignments/duplicateRefereeValidation.integration.test.ts`
  - `backend/tests/integration/referee-assignments/refereeNotAssignable.integration.test.ts`
  - `backend/tests/integration/referee-assignments/authFailures.integration.test.ts`
  - `backend/tests/integration/referee-assignments/securityRedaction.integration.test.ts`
  - `backend/tests/integration/referee-assignments/transportSecurity.integration.test.ts`
  - `backend/tests/integration/referee-assignments/atRestProtection.integration.test.ts`
  - `backend/tests/integration/referee-assignments/invitationRetryBudget.integration.test.ts`
- Unit tests: `backend/tests/unit/refereeAssignmentSupport.unit.test.ts`
- Frontend e2e specs: `frontend/tests/e2e/referee-assignments/`
- Browser evidence checklist: `frontend/tests/e2e/referee-assignments/browser-validation.md`
- Backup/restore notes: `infra/ops/backup-restore.md`
- Incident response notes: `infra/ops/incident-response.md`

## Validation Checklist

- Eligible editor assignments succeed and return explicit confirmation.
- Any invalid referee in a batch causes full request rejection with zero assignments persisted.
- Workload and paper-capacity violations return explicit, rule-specific feedback.
- Duplicate referee IDs in one request are rejected with duplicate-entry messaging.
- Concurrent assignment attempts for the same paper do not exceed policy limits.
- Invitation failures after assignment commit are visible and retryable without assignment rollback.
- Logs and errors avoid sensitive referee details in plaintext.

## Traceability Matrix

| Requirement / Test Objective | Primary Tests |
|---|---|
| AT-UC07-01 successful assignment + invitation status | `assignReferees.success.integration.test.ts`, `postAssignments.contract.test.ts` |
| AT-UC07-02 workload rejection + retry | `workloadViolation.integration.test.ts`, `workloadRetry.integration.test.ts`, `workloadViolation.contract.test.ts` |
| AT-UC07-03 paper-capacity rejection | `paperCapacityViolation.integration.test.ts`, `paperCapacityConcurrency.integration.test.ts`, `paperCapacityViolation.contract.test.ts` |
| Serialized same-paper processing (RAR-006) | `perPaperSerialization.foundation.integration.test.ts`, `paperCapacityConcurrency.integration.test.ts` |
| Duplicate referee rejection (FR-014) | `duplicateAtomicity.foundation.integration.test.ts`, `duplicateRefereeValidation.integration.test.ts` |
| Transport security (SPR-001) | `transportSecurity.integration.test.ts` |
| At-rest protection evidence (SPR-002) | `atRestProtection.integration.test.ts`, `infra/ops/backup-restore.md` |
| No-sensitive-data logging (SPR-003) | `logRedaction.foundation.integration.test.ts`, `securityRedaction.integration.test.ts`, `refereeAssignmentSupport.unit.test.ts` |
