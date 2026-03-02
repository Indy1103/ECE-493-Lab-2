# Quickstart: Access Assigned Paper for Review (UC-09)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.
- Seed data includes at least one referee with accepted assignment(s), plus no-assignment and unavailable-assignment cases.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC09-01`, `AT-UC09-02`, and `AT-UC09-03`.
2. Add failing backend tests for:
   - assignment list success,
   - no-assignment empty state,
   - unavailable/not-found/session-expired access outcomes,
   - availability revalidation and atomic paper+form checks,
   - transport security and at-rest assertions,
   - performance threshold for assigned-paper access.
3. Implement backend presentation routes:
   - `GET /api/referee/assignments`
   - `POST /api/referee/assignments/{assignmentId}/access`
4. Implement backend business/data/security components:
   - session guard,
   - assignment authorization,
   - assignment listing + access workflows,
   - audit recording,
   - repository adapters for assignment/paper/review-form access state.
5. Implement frontend UC-09 list/access flow with explicit empty-state and unavailable/session-expired messaging.
6. Run lint, contract, unit, integration, and coverage checks.

## Verification Commands

1. `npm run lint -w backend`
2. `npm run lint -w frontend`
3. `npm run lint:contracts:referee-access -w backend`
4. `npm run test -w backend`
5. `npm run coverage -w backend`

## Execution Evidence

- Date executed: March 2, 2026.
- `npm run test -w backend`: passed (`260` passed, `0` failed).
- `npm run coverage -w backend`: passed with global `100%` statements / `100%` branches / `100%` functions / `100%` lines.
- SC-001 performance check: `backend/tests/integration/referee-access/performance.integration.test.ts` passed with requirement `p95 <= 5s`.

## Evidence Links

- Contract tests:
  - `backend/tests/contract/referee-access/assignedPaperAccess.contract.test.ts`
  - `backend/tests/contract/referee-access/noAssignments.contract.test.ts`
  - `backend/tests/contract/referee-access/unavailableAccess.contract.test.ts`
- Integration tests:
  - `backend/tests/integration/referee-access/assignedPaperAccess.integration.test.ts`
  - `backend/tests/integration/referee-access/noAssignments.integration.test.ts`
  - `backend/tests/integration/referee-access/unavailableAccess.integration.test.ts`
  - `backend/tests/integration/referee-access/transportSecurity.integration.test.ts`
  - `backend/tests/integration/referee-access/dataProtection.integration.test.ts`
  - `backend/tests/integration/referee-access/performance.integration.test.ts`
- Unit tests:
  - `backend/tests/unit/refereeAccessSupport.unit.test.ts`
- Frontend e2e specs:
  - `frontend/tests/e2e/referee-access/assigned-paper-success.e2e.ts`
  - `frontend/tests/e2e/referee-access/no-assignments.e2e.ts`
  - `frontend/tests/e2e/referee-access/unavailable-or-expired.e2e.ts`
- Browser validation checklist:
  - `frontend/tests/e2e/referee-access/browser-validation.md`
- Operational protection notes:
  - `infra/ops/backup-restore.md`

## Validation Checklist

- Referee with active accepted assignment can list and access paper + review form.
- Referee with no eligible assignments receives explicit `NO_ASSIGNMENTS` outcome.
- Unavailable/stale/non-owned assignment access is denied with non-enumerating outcomes.
- Expired or invalid session returns explicit `SESSION_EXPIRED`.
- UC-09 routes reject non-TLS transport.
- Assignment/review-linkage access state remains protected for at-rest and backup handling.
- No sensitive linkage values are emitted in plaintext logs/payloads.

## Traceability Matrix

| Requirement / Test Objective | Primary Tests |
|---|---|
| AT-UC09-01 assigned-paper access success path | `assignedPaperAccess.contract.test.ts`, `assignedPaperAccess.integration.test.ts`, `assigned-paper-success.e2e.ts` |
| AT-UC09-02 no-assignment explicit outcome | `noAssignments.contract.test.ts`, `noAssignments.integration.test.ts`, `no-assignments.e2e.ts` |
| AT-UC09-03 unavailable/stale/session-expired outcomes | `unavailableAccess.contract.test.ts`, `unavailableAccess.integration.test.ts`, `unavailable-or-expired.e2e.ts` |
| SPR-001 TLS-only transport enforcement | `transportSecurity.integration.test.ts` |
| SPR-002 at-rest protection + backup coverage | `dataProtection.integration.test.ts`, `infra/ops/backup-restore.md` |
| SPR-003 sensitive-data-safe observability | `refereeAccessSupport.unit.test.ts`, `dataProtection.integration.test.ts` |
| SC-001 assigned-paper access performance threshold | `performance.integration.test.ts` |
