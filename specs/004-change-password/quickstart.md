# Quickstart: Change Account Password (UC-04)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC04-01` and `AT-UC04-02`.
2. Add failing integration tests for:
   - current password verification failure,
   - password history reuse rejection (last 5),
   - per-account/per-IP lockout,
   - session revocation after success,
   - operational failure rollback behavior.
3. Implement presentation-layer endpoint using `contracts/password-change.openapi.yaml`.
4. Implement business-layer service for validation, policy enforcement, and orchestration.
5. Implement data-layer transaction for credential update, history write, attempt record, and session revocation.
6. Add structured audit logging without credential payloads.
7. Run full test and lint checks.

## Validation Matrix (2026-03-02)

| Check | Command / Evidence | Result |
|---|---|---|
| Backend unit + contract + integration suites | `npm run test -w backend` | PASS (`108` passed, `0` failed) |
| Workspace test run | `npm test` | PASS (backend pass, frontend Node tests `0` discovered) |
| Typecheck/lint gates | `npm run lint` | PASS |
| Backend branch coverage | `npm run coverage -w backend` | PASS (`Statements 100`, `Branches 100`, `Functions 100`, `Lines 100`) |
| Contract parity (`200/400/401/409/429/500`) | `backend/tests/contract/password-change.contract.test.ts` + OpenAPI examples | PASS |
| Success flow + revocation | `backend/tests/integration/password-change.integration.test.ts` test: successful password change | PASS |
| Invalid current / expired session / throttling / rollback / conflict | `backend/tests/integration/password-change.integration.test.ts` | PASS |
| Performance p95 target | `backend/tests/integration/password-change.performance.test.ts` and direct sample run | PASS (`p95=105ms`, target `<=500ms`) |

## Browser Coverage Record

| Flow | Chrome | Firefox | Notes |
|---|---|---|---|
| Change password success | PASS | PASS | Executed via local Playwright harness rendering `ChangePasswordForm`; both browsers navigated to `/login` after valid submission. |
| Invalid submission then retry | PASS | PASS | Executed via same harness with mocked API responses (`400` then `200`); validation message rendered, then successful redirect to `/login`. |

Browser check command and result:

```bash
node frontend/.tmp-uc04-browser-check.mjs
```

```json
{
  "results": [
    { "browser": "Chrome", "pass": true, "url": "http://127.0.0.1:4173/login" },
    { "browser": "Firefox", "pass": true, "url": "http://127.0.0.1:4173/login" }
  ]
}
```

## Recovery Drill Record

- See [`infra/ops/recovery/password-change-recovery.md`](/Users/indy/Desktop/ECE%20493%20Lab/ECE%20493%20Lab%202/infra/ops/recovery/password-change-recovery.md) for snapshot/restore drill evidence across credential, session, and audit data.
