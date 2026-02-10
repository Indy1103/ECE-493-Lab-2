# Quickstart: Save Paper Submission Draft (UC-06)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC06-01` and `AT-UC06-02`.
2. Add failing integration tests for:
   - unauthorized/expired-session draft save rejection,
   - ownership enforcement on save and resume,
   - validation failure with no resumable state update,
   - successful save persistence and later resume retrieval,
   - concurrent valid saves with deterministic last-write-wins,
   - operational failure preserving prior valid saved draft.
3. Implement presentation-layer endpoints using `contracts/submission-drafts.openapi.yaml`.
4. Implement business-layer draft validation, save orchestration, and concurrency policy.
5. Implement data-layer persistence for current draft, snapshots, and save-attempt audit records.
6. Add structured audit logging without draft payload leakage.
7. Run full test and lint checks.

## Validation Checklist

- Valid draft save returns explicit confirmation and persisted current draft state.
- Invalid draft save returns validation issues and does not create/update resumable state from that failed request.
- Saved draft is retrievable later by the owning author for continuation.
- Non-owner and unauthenticated access are rejected explicitly.
- Concurrent valid saves do not corrupt state and resolve deterministically.
- No plaintext draft payload appears in logs or error payloads.
