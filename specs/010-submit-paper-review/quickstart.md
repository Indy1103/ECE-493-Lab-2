# Quickstart: UC-10 Submit Paper Review

## Prerequisites
- Backend and frontend dependencies installed.
- PostgreSQL running with latest migrations applied.
- Fixture data includes a referee with accepted assignment and available review form.

## 1. Validate contract marker
```bash
npm run lint:contracts:review-submission -w backend
```

Expected: command exits `0` and confirms required OpenAPI marker paths:
- `/api/referee/assignments/{assignmentId}/review-form`
- `/api/referee/assignments/{assignmentId}/review-submissions`

## 2. Validate backend compile + tests
```bash
npm run lint -w backend
npm run test -w backend
```

Observed (2026-03-02):
- `lint` passed
- `test` passed (`282` tests, `0` failures)

## 3. Validate strict coverage gate
```bash
npm run coverage -w backend
```

Observed (2026-03-02):
- Coverage gate passed with global thresholds:
  - Statements: `100%`
  - Branches: `100%`
  - Functions: `100%`
  - Lines: `100%`

## 4. Manual browser matrix status
- Browser matrix execution checklist is tracked in:
  - `frontend/tests/e2e/review-submission/browser-validation.md`
- Current state: not executed yet (all checkbox items still open).

## 5. UC-10 acceptance outcomes
- Eligible referees can retrieve a review form and submit exactly one final review.
- Invalid/incomplete payloads return `validation-failed` with explicit issues.
- Non-owned, duplicate, and submit-time-ineligible requests return `submission-unavailable`.
- Missing/expired sessions return `session-expired`.
- Audit records redact review content (`responses`/`content`) and preserve reason codes.
