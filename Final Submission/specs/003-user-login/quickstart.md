# Quickstart: User Login Authentication

## Purpose

Validate UC-03 behavior and constitutional constraints for login before implementation tasks proceed.

## Prerequisites

- Feature branch: `003-user-login`
- Node.js and package manager configured for project commands
- PostgreSQL instance available for account/session persistence
- Browser test runners for Chrome and Firefox

## 1. Contract-first and test-first setup

1. Author failing contract tests for `POST /api/public/login` using `contracts/user-login.openapi.yaml`.
2. Author failing integration tests for:
   - successful authentication (`200 AUTHENTICATED`)
   - invalid credentials (`401 INVALID_CREDENTIALS`)
   - throttled attempts (`429 LOGIN_THROTTLED`)
   - operational failure (`503 AUTHENTICATION_UNAVAILABLE`)
3. Author failing security tests confirming:
   - no plaintext credential storage/logging
   - non-encrypted transport attempts are rejected
4. Author failing reliability tests for concurrent attempts and deterministic outcome behavior.

## 2. Implement by layer

1. Data layer: account lookup, session persistence, and throttling record updates.
2. Business layer: credential verification, throttling enforcement, role-home routing, and outcome mapping.
3. Presentation/API layer: expose login endpoint and contract-compliant responses.
4. Observability: emit structured login outcome logs with request IDs and authentication outcome metrics.

## 3. Verification checklist

1. Valid username/password authenticates the user and returns role-specific home destination.
2. Invalid credentials return explicit failure messaging without authentication.
3. Repeated failed attempts from same client enforce cooldown and return throttled response.
4. Operational failures return explicit retry-capable messaging without sensitive internals.
5. Credentials are never stored or emitted in plaintext.
6. Contract, integration, and browser tests pass in Chrome and Firefox.

## 4. Traceability

- Use case: `UC-03`
- Acceptance tests: `AT-UC03-01`, `AT-UC03-02`
- Spec: `spec.md`
- Plan: `plan.md`
- Research: `research.md`
- Data model: `data-model.md`
- Contract: `contracts/user-login.openapi.yaml`
