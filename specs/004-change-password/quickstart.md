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

## Validation Checklist

- Valid request updates password and forces re-login.
- Invalid request preserves existing password and returns explicit feedback.
- Failed-attempt throttling returns `429` with `Retry-After`.
- Concurrent submissions do not corrupt credential state.
- Audit events are emitted for success and failure outcomes.
- No plaintext password appears in logs, DB audit rows, or API responses.
