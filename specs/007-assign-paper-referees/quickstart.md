# Quickstart: Assign Referees to Submitted Papers (UC-07)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.
- Seed data includes at least one editor, submitted paper in awaiting-assignment state, and referees with varied workloads.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC07-01`, `AT-UC07-02`, and `AT-UC07-03`.
2. Add failing integration tests for:
   - unauthenticated/expired-session assignment rejection,
   - non-editor authorization rejection,
   - duplicate referee IDs rejected atomically,
   - workload-limit violation rejected with no assignment persisted,
   - paper-capacity violation rejected with no assignment persisted,
   - successful atomic assignment + invitation intent creation,
   - concurrent same-paper assignment requests serialized,
   - invitation dispatch failure does not roll back persisted assignments and returns retryable status.
3. Implement presentation-layer endpoints using `contracts/referee-assignments.openapi.yaml`.
4. Implement business-layer policy validation (capacity, workload, duplicate detection, atomic all-or-nothing behavior).
5. Implement data-layer transactional persistence and per-paper serialization lock.
6. Implement invitation dispatch worker/path with retryable failure statuses and explicit operational feedback.
7. Add structured assignment/invitation audit logging without sensitive referee data leakage.
8. Run full test and lint checks.

## Validation Checklist

- Eligible editor assignments succeed and return explicit confirmation.
- Any invalid referee in a batch causes full request rejection with zero assignments persisted.
- Workload and paper-capacity violations return explicit, rule-specific feedback.
- Duplicate referee IDs in one request are rejected with duplicate-entry messaging.
- Concurrent assignment attempts for the same paper do not exceed policy limits.
- Invitation failures after assignment commit are visible and retryable without assignment rollback.
- Logs and errors avoid sensitive referee details in plaintext.
