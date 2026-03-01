# Quickstart: Submit Paper Manuscript (UC-05)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- Encrypted object storage configured for manuscript artifacts.
- TLS enabled for non-local environments.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC05-01`, `AT-UC05-02`, and `AT-UC05-03`.
2. Add failing integration tests for:
   - unauthenticated/expired-session rejection,
   - metadata validation failures for required fields,
   - file type and size validation failures,
   - duplicate active submission rejection with normalized title rules,
   - concurrent same-author duplicate race with single-winner outcome,
   - operational-failure rollback (no accepted partial state).
3. Implement presentation-layer endpoints using `contracts/manuscript-submissions.openapi.yaml`.
4. Implement business-layer submission service for policy validation, normalization, duplicate detection, and deterministic outcome mapping.
5. Implement data-layer transaction boundary for submission, metadata, artifact reference, and audit-attempt persistence.
6. Implement encrypted object-storage adapter and integrity metadata capture.
7. Add structured audit logging for all submission outcomes without manuscript payload logging.
8. Run full test and lint checks.

## Validation Checklist

- Valid metadata + valid PDF <= 20 MB returns success and accepted submission status.
- Missing/invalid metadata returns explicit validation violations and no accepted submission.
- Invalid file type/size returns explicit file-rule response and no accepted submission.
- Expired/invalid session returns explicit authorization failure and auditable outcome.
- Duplicate active submission in same cycle by same author/title is rejected deterministically.
- Concurrent same-title submissions produce one accepted active submission and explicit duplicate response for others.
- Submission outcomes are auditable with reason codes and no plaintext manuscript data in logs.
