# Quickstart: Save Paper Submission Draft (UC-06)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.

## Implementation Flow (TDD)

1. Start from failing foundational integration tests in `backend/tests/integration/submission-drafts/`.
2. Add failing contract tests in `backend/tests/contract/submission-drafts/`.
3. Implement backend presentation/business/data/security/audit layers under `backend/src/**/submission-drafts/`.
4. Add resume/save frontend client + action + UI wiring in `frontend/src/**/submission-drafts/`.
5. Add migration + schema updates for draft tables and enums.
6. Verify with lint, tests, and coverage.

## Verification Commands

1. `npm run lint -w backend`
2. `npm run lint -w frontend`
3. `npm run test -w backend`
4. `npm run coverage -w backend`

## Evidence Links

- Contract tests: `backend/tests/contract/submission-drafts/`
- Integration tests: `backend/tests/integration/submission-drafts/`
- Unit tests: `backend/tests/unit/submissionDraftSupport.unit.test.ts`
- Frontend e2e specs: `frontend/tests/e2e/submission-drafts/`
- Browser evidence checklist: `frontend/tests/e2e/submission-drafts/browser-validation.md`
- Backup/restore notes: `infra/ops/backup-restore.md`

## Validation Checklist

- Valid draft save returns explicit confirmation and persisted current draft state.
- Invalid draft save returns validation issues and does not create/update resumable state from that failed request.
- Saved draft is retrievable later by the owning author for continuation.
- Non-owner and unauthenticated access are rejected explicitly.
- Concurrent valid saves do not corrupt state and resolve deterministically.
- No plaintext draft payload appears in logs or error payloads.
