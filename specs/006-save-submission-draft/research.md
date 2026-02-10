# Phase 0 Research: Save Paper Submission Draft (UC-06)

## Decision 1: Draft validation boundary

- Decision: Validate only provided fields plus the minimal baseline required field (`title`) for draft save; do not enforce final-submission completeness at draft-save time.
- Rationale: Preserves incremental author workflow while maintaining rule-based validation and explicit error communication.
- Alternatives considered:
  - Full final-submission validation on draft save: rejected because it blocks partial progress and conflicts with UC-06 intent.
  - No validation on draft save: rejected due to data quality and explicit-validation policy requirements.

## Decision 2: Single current draft model

- Decision: Maintain one current draft per `(author, in-progress submission)` and overwrite on each successful save.
- Rationale: Simplifies resume semantics, reduces ambiguity, and aligns with clarified feature scope.
- Alternatives considered:
  - Multiple named drafts: rejected as out of scope and higher UX/model complexity.
  - Append-only immutable drafts: rejected as unnecessary for UC-06 baseline behavior.

## Decision 3: Concurrent save conflict handling

- Decision: Resolve concurrent valid saves deterministically with last-write-wins and record each attempt in audit logs.
- Rationale: Provides predictable final state while preventing corruption and supporting forensic traceability.
- Alternatives considered:
  - First-write-wins: rejected due to stale-state UX and hidden update loss.
  - Conflict-error on second write: rejected due to higher user friction for common rapid-save patterns.

## Decision 4: Ownership and authorization control

- Decision: Enforce authenticated author ownership checks on both draft save and resume retrieval paths.
- Rationale: Required by least-privilege and confidentiality policies for protected data access.
- Alternatives considered:
  - Submission-ID-only access without ownership check: rejected due to unauthorized access risk.
  - Role-only check without object ownership validation: rejected as insufficient for per-author draft isolation.

## Decision 5: Operational failure semantics

- Decision: If a save operation fails after request acceptance, keep the most recent previously saved valid draft as the resumable state and return explicit retry-capable guidance.
- Rationale: Preserves resumability guarantees and avoids partial/corrupt saved state exposure.
- Alternatives considered:
  - Partial state commit with warning: rejected due to data integrity risk.
  - Silent failure with no guidance: rejected by explicit-error policy.

## Decision 6: Audit logging schema

- Decision: Emit structured draft-save attempt events with timestamp, author_id, submission_id, outcome, reason_code, request_id; exclude draft payload content.
- Rationale: Satisfies auditability requirements while protecting sensitive manuscript-related content.
- Alternatives considered:
  - Success-only logging: rejected due to missing failure observability.
  - Verbose payload logging: rejected due to confidentiality constraints.
