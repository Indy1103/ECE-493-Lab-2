# Quickstart: Author Receive Decision (UC-13)

## Goal

Notify authors when a final decision is available and allow them to view accept/reject outcomes.

## Preconditions

- Author is registered and logged in.
- Paper was submitted by the author.
- A final decision has been recorded for the paper.

## Happy Path (UC-13-S1)

1. System sends decision-available notification.
2. Author accesses decision in the CMS.
3. System presents accept/reject outcome.

## Notification Failure Path (UC-13-S2)

1. System attempts to send notification.
2. Notification fails; author is not notified.
3. Author remains unaware of the decision outcome.

## Acceptance Test Traceability

- UC-13-S1 → AT-UC13-01
- UC-13-S2 → AT-UC13-02

## Verification Checklist

- Contract tests (Supertest):
  - `cd backend && node --import tsx --test "tests/contract/author-decision/*.test.ts"`
- Integration tests (Supertest):
  - `cd backend && node --import tsx --test "tests/integration/author-decision/*.test.ts"`
- Unit tests (Node.js test runner):
  - `cd backend && node --import tsx --test tests/unit/authorDecisionSupport.unit.test.ts`
- UC-13 feature coverage (100% branches/functions/lines/statements):
  - `cd backend && c8 --all --check-coverage --branches 100 --functions 100 --lines 100 --statements 100 --include "src/business/author-decision/*.ts" --include "src/data/author-decision/*.ts" --include "src/presentation/author-decision/*.ts" --reporter text node --import tsx --test tests/unit/authorDecisionSupport.unit.test.ts "tests/contract/author-decision/*.test.ts" "tests/integration/author-decision/*.test.ts"`
- Browser matrix references:
  - `frontend/tests/e2e/author-decision/author-decision-success.e2e.ts`
  - `frontend/tests/e2e/author-decision/author-decision-notification-failed.e2e.ts`
  - `frontend/tests/e2e/author-decision/browser-validation.md`
