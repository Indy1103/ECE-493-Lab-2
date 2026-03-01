# Phase 0 Research: Assign Referees to Submitted Papers (UC-07)

## Decision 1: Per-paper serialization primitive (**NEEDS CLARIFICATION resolved**)

- Decision: Use row-level pessimistic locking on the target paper-assignment aggregate (`SELECT ... FOR UPDATE` or Prisma transaction equivalent) so assignment requests for the same paper are processed one at a time.
- Rationale: Matches clarified requirement for serialized per-paper handling and keeps locking scope narrow to a specific paper.
- Alternatives considered:
  - Advisory locks keyed by paper ID: viable but adds operational complexity and lock-lifecycle handling overhead.
  - Optimistic concurrency only: rejected because retries can still produce fairness issues and noisier editor UX.

## Decision 2: Invitation retry integration path (**NEEDS CLARIFICATION resolved**)

- Decision: Persist invitation intent records inside the assignment transaction, then execute dispatch asynchronously with retry status fields (`PENDING`, `SENT`, `FAILED_RETRYABLE`, `FAILED_FINAL`).
- Rationale: Keeps assignment commit authoritative (FR-013), provides explicit retryable handling (RAR-005), and avoids rollback coupling to external delivery.
- Alternatives considered:
  - Synchronous inline retries only: rejected due to increased request latency and weaker operational recoverability.
  - Roll back assignment on invitation failure: rejected because it conflicts with clarified behavior and FR-013.

## Decision 3: Atomic multi-referee validation and persistence

- Decision: Validate duplicates, paper capacity, referee existence/eligibility, and workload for the full input set before inserting any assignment rows; persist all rows in one transaction only when every candidate passes.
- Rationale: Implements all-or-nothing semantics (FR-012) and guarantees no partial assignment side effects (FR-009).
- Alternatives considered:
  - Per-referee partial success: rejected because atomic semantics were explicitly clarified.
  - Validate/persist incrementally: rejected due to partial-write rollback complexity.

## Decision 4: RBAC and authorization feedback

- Decision: Require authenticated session + editor role check at service boundary and return explicit authorization errors for non-editor or expired-session access.
- Rationale: Satisfies SPR-004 and constitutional least-privilege requirements while keeping failure reasons user-visible and auditable.
- Alternatives considered:
  - UI-only role gating: rejected because backend enforcement is mandatory.
  - Generic forbidden response without reason code: rejected due to explicit-error policy.

## Decision 5: Assignment and invitation audit schema

- Decision: Emit structured outcome records for assignment attempts and invitation delivery with `request_id`, `paper_id`, `editor_id`, `candidate_referee_ids_count`, `outcome`, `reason_code`, and timestamps; avoid sensitive referee profile details in payload/log text.
- Rationale: Meets RAR-003 and SPR-003 with traceable, privacy-preserving observability.
- Alternatives considered:
  - Success-only audit events: rejected because failure-path traceability is required.
  - Full referee details in logs: rejected due to confidentiality constraints.
