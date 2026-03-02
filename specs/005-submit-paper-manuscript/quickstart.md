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

## Browser Verification Evidence (Chrome + Firefox)

Date: 2026-03-02

- Chrome: `frontend/tests/e2e/submit-manuscript.spec.ts` checklist updated for success path, metadata recovery, file recovery, and intake-closed guidance.
- Firefox: `frontend/tests/e2e/submit-manuscript.spec.ts` checklist updated for success path, metadata recovery, file recovery, and intake-closed guidance.
- Cross-browser result expectation: no message divergence for `VALIDATION_FAILED`, `INTAKE_CLOSED`, `FILE_TYPE_NOT_ALLOWED`, or success confirmation.

## TLS-only Endpoint Verification Evidence

Date: 2026-03-02

- Verified integration coverage for transport rejection in:
  - `backend/tests/integration/manuscript-submissions.integration.test.ts` (`non-TLS submission attempts are rejected with 426`)
- Contract updated with explicit `426` response for:
  - `GET /api/v1/manuscript-submissions/requirements`
  - `POST /api/v1/manuscript-submissions`

## Requirement-to-Test Traceability Matrix (UC-05)

| Requirement / Acceptance | Verification Artifact |
|---|---|
| UC-05 main flow, AT-UC05-01 | `backend/tests/contract/manuscript-submissions.contract.test.ts`, `backend/tests/integration/manuscript-submissions.integration.test.ts` |
| UC-05 metadata failure, AT-UC05-02 | `backend/tests/contract/manuscript-submissions.contract.test.ts`, `backend/tests/integration/manuscript-submissions.integration.test.ts` |
| UC-05 file failure, AT-UC05-03 | `backend/tests/contract/manuscript-submissions.contract.test.ts`, `backend/tests/integration/manuscript-submissions.integration.test.ts` |
| RAR-006 deterministic single winner | `backend/tests/integration/manuscript-submissions.concurrency.test.ts` |
| Performance p95 <= 700ms | `backend/tests/integration/manuscript-submissions.performance.test.ts` |
| SPR-001 TLS-only transport | `backend/tests/integration/manuscript-submissions.integration.test.ts` |
| SPR-003 redaction coverage | `backend/tests/unit/manuscriptSubmissionSupport.unit.test.ts` |
