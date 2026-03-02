# UC-12 Browser Validation Matrix

- Chrome: `final-decision-success.e2e.ts`, `final-decision-pending.e2e.ts`
- Firefox: `final-decision-success.e2e.ts`, `final-decision-pending.e2e.ts`
- Expected: consistent final-decision success and pending-block behavior.

## Execution Notes

- Command:
  - `npx playwright test frontend/tests/e2e/final-decision/final-decision-success.e2e.ts frontend/tests/e2e/final-decision/final-decision-pending.e2e.ts --project=chromium --project=firefox`
- Verification points:
  - Success flow shows decision recorded confirmation and retains selected outcome.
  - Pending flow shows explicit block message and does not show review content.
