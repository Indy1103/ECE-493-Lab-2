# Quickstart: UC-10 Submit Paper Review

## Prerequisites
- Backend and frontend dependencies installed.
- PostgreSQL running with latest migrations applied.
- Fixture data includes a referee with accepted assignment and available review form.

## 1. Run failing tests first (TDD gate)
- Add/enable tests for:
  - Successful review submission (AT-UC10-01)
  - Invalid/incomplete submission handling (AT-UC10-02)
  - Duplicate final submission denial
  - Submit-time ineligible assignment denial
  - Generic non-enumerating non-owned/non-assigned denial
  - Session-expired submit failure

## 2. Implement backend flow
- Add presentation handlers for:
  - `GET /api/referee/assignments/{assignmentId}/review-form`
  - `POST /api/referee/assignments/{assignmentId}/review-submissions`
- Implement business services for:
  - Submit-time eligibility revalidation
  - Required/domain validation
  - Single-final-submission enforcement
  - Success/failure outcome mapping
- Implement data repositories for:
  - Review submission persistence
  - Eligibility lookups
  - Structured audit events

## 3. Implement frontend flow
- Review form retrieval and rendering for eligible assignment.
- Submission flow with explicit success confirmation.
- Validation error display with correction-and-resubmit support.
- Explicit outcomes for unavailable and session-expired paths.

## 4. Validate locally
- Run unit/integration/contract backend tests.
- Run frontend integration/e2e tests in Chrome and Firefox.
- Verify no sensitive review content appears in logs/error payloads.

## 5. Expected outcomes
- Eligible referees can submit exactly one final review for assigned papers.
- Invalid submissions are rejected with actionable validation feedback.
- Unauthorized, ineligible, or expired-session submissions are rejected explicitly and auditable.
