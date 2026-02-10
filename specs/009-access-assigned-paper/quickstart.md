# Quickstart: UC-09 Access Assigned Paper for Review

## Prerequisites
- Backend and frontend dependencies installed.
- PostgreSQL running with latest migrations applied.
- Test fixture users include at least one referee with accepted invitation(s).

## 1. Run failing tests first (TDD gate)
- Add/enable tests for:
  - Success flow (AT-UC09-01)
  - No-assignment flow (AT-UC09-02)
  - Unavailable-paper flow (AT-UC09-03)
  - Unauthorized direct-access generic response
  - Session-expired protected access behavior
  - Assignment-state-change revalidation behavior
  - Atomic paper+form retrieval failure behavior

## 2. Implement backend flow
- Add presentation handlers for:
  - `GET /api/referee/assignments`
  - `POST /api/referee/assignments/{assignmentId}/access`
- Implement business service with centralized checks:
  - Session validity
  - Assignment ownership + accepted invitation
  - Current availability revalidation at selection
  - Atomic paper/form retrieval
- Implement data layer queries in Prisma repositories.
- Emit structured audit events on all outcomes.

## 3. Implement frontend flow
- Assigned papers list view with explicit empty state.
- Access action from selected assignment.
- Explicit messages for unavailable paper and session-expired outcomes.
- Refresh list on stale assignment outcome.

## 4. Validate locally
- Run unit/integration/contract tests for backend.
- Run frontend integration/e2e tests in Chrome and Firefox paths.
- Confirm no sensitive data appears in logs or error payloads.

## 5. Expected outcomes
- Referees can access assigned paper and review form only when authorized and available.
- Failure outcomes are explicit, consistent, non-enumerating, and auditable.
