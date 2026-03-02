# Quickstart: Record Final Decision (UC-12)

## Goal

Allow an editor to record a final acceptance/rejection decision for a paper only after all required reviews are completed, and notify the author.

## Preconditions

- Editor is registered and logged in.
- Paper exists and is submitted.
- Required reviews are completed for success path.

## Happy Path (UC-12-S1)

1. Select a paper with all required reviews completed.
2. Choose `ACCEPT` or `REJECT`.
3. Submit decision.
4. Confirm decision saved and author notified.

## Pending Reviews Path (UC-12-S2)

1. Select a paper with pending required reviews.
2. Attempt to record a final decision.
3. Verify decision is blocked with an explicit message and no decision is recorded or notified.

## Acceptance Test Traceability

- UC-12-S1 → AT-UC12-01
- UC-12-S2 → AT-UC12-02

## Verification Checklist

1. Run backend tests and verify UC-12 contract/integration/unit suites pass:
   - `npm run test -w backend`
2. Run backend coverage and verify 100% thresholds:
   - `npm run coverage -w backend`
3. Validate UC-12 browser scenarios in Chrome and Firefox:
   - `npx playwright test frontend/tests/e2e/final-decision/final-decision-success.e2e.ts --project=chromium --project=firefox`
   - `npx playwright test frontend/tests/e2e/final-decision/final-decision-pending.e2e.ts --project=chromium --project=firefox`
4. Confirm recovery checklist and monitoring artifacts are present:
   - `infra/ops/recovery/final-decision-recovery.md`
   - `infra/ops/monitoring/final-decision-slo.yml`
