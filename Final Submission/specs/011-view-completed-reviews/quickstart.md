# Quickstart: UC-11 View Completed Paper Reviews

## Prerequisites
- Backend and frontend dependencies installed.
- PostgreSQL running with latest migrations applied.
- Fixture data includes an editor user and at least one paper with completed reviews and one with pending reviews.

## 1. Run failing tests first (TDD gate)
- Add/enable tests for:
  - Completed reviews visible for eligible editor (AT-UC11-01)
  - Pending reviews response with no review content (AT-UC11-02)
  - Generic unavailable/denied outcome for non-editor access
  - Anonymized review entries (no referee identity fields)
  - Session-expired failure path

## 2. Implement backend flow
- Add presentation handler for:
  - `GET /api/editor/papers/{paperId}/reviews`
- Implement business services for:
  - Editor RBAC checks
  - Completion-status gating
  - Anonymized review mapping
  - Outcome mapping (visible, pending, unavailable/denied, session-expired)
- Implement data repositories for:
  - Review completion status
  - Completed review retrieval
  - Audit logging of outcomes

## 3. Implement frontend flow
- Editor review list request and rendering of anonymized reviews.
- Pending-reviews message when required reviews are incomplete.
- Generic unavailable/denied outcome handling without resource disclosure.

## 4. Validate locally
- Run unit/integration/contract backend tests.
- Run frontend e2e tests in Chrome and Firefox.
- Verify no referee identity attributes appear in logs or error payloads.

## 5. Expected outcomes
- Editors view all completed reviews only when required reviews are complete.
- Pending state returns no review content.
- Non-editor access returns generic unavailable/denied outcome.
- Review content is anonymized for editor consumption.
