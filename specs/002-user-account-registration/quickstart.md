# Quickstart: User Account Registration

## Purpose

Validate UC-02 behavior and constitutional constraints for account registration before implementation tasks proceed.

## Prerequisites

- Feature branch: `002-user-account-registration`
- Node.js and package manager configured for project commands
- PostgreSQL instance available for user-account persistence
- Browser test runners for Chrome and Firefox

## 1. Contract-first and test-first setup

1. Author failing contract tests for `POST /api/public/registrations` using `contracts/user-registration.openapi.yaml`.
2. Author failing integration tests for:
   - successful registration (`201 REGISTERED`)
   - invalid/incomplete input (`400 VALIDATION_FAILED`)
   - duplicate email (`409 DUPLICATE_EMAIL`)
   - throttling (`429 THROTTLED`)
3. Author failing security tests confirming:
   - no plaintext credential persistence/logging
   - duplicate-email checks use normalized email
4. Author failing reliability tests for concurrent duplicate-email attempts and deterministic outcome behavior.

## 2. Implement by layer

1. Data layer: enforce normalized email uniqueness and persist user-account records.
2. Business layer: validate submission, apply throttling, hash password, and map deterministic outcomes.
3. Presentation/API layer: expose registration endpoint with contract-compliant success/error payloads.
4. Observability: emit structured outcome logs with request IDs and registration outcome metrics.

## 3. Verification checklist

1. Valid unique registration creates an account and communicates login readiness.
2. Invalid or incomplete input returns explicit corrective messaging.
3. Already-registered email is rejected with duplicate-email messaging.
4. Throttled clients receive explicit cooldown messaging after threshold breach.
5. Credentials are never stored or emitted in plaintext.
6. Contract tests, integration tests, and browser tests pass in Chrome and Firefox.

## 4. Traceability

- Use case: `UC-02`
- Acceptance tests: `AT-UC02-01`, `AT-UC02-02`, `AT-UC02-03`
- Spec: `spec.md`
- Plan: `plan.md`
- Research: `research.md`
- Data model: `data-model.md`
- Contract: `contracts/user-registration.openapi.yaml`
