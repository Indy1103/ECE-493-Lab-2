# Phase 0 Research: Submit Paper Manuscript (UC-05)

## Decision 1: Submission request format and validation boundary

- Decision: Use a single multipart/form-data submission request containing a JSON metadata part and a manuscript file part, with schema validation before persistence.
- Rationale: This keeps metadata and file coupled for deterministic validation outcomes and aligns with explicit error messaging requirements.
- Alternatives considered:
  - Separate metadata and file endpoints: rejected due to increased partial-failure and orchestration complexity.
  - Base64 file in JSON payload: rejected due to unnecessary payload bloat and weaker upload ergonomics.

## Decision 2: Required metadata policy authority

- Decision: Treat `CMS Manuscript Submission Policy v1.0` as the single authoritative source for required metadata fields per active cycle, and include the resolved required fields directly in feature requirements.
- Rationale: This satisfies fixed-cycle consistency while preserving traceability and governance for policy changes.
- Alternatives considered:
  - Multiple policy sources by conference track: rejected as ambiguity-prone for this feature scope.
  - Runtime-discovered field sets without version pinning: rejected due to nondeterministic validation behavior.

## Decision 3: Manuscript storage and integrity representation

- Decision: Store manuscript binary only in encrypted object storage and persist object key + integrity metadata (content hash, byte size, media type) in PostgreSQL submission records.
- Rationale: Matches confidentiality constraints and supports integrity verification without exposing manuscript contents in relational storage.
- Alternatives considered:
  - Store binary blobs directly in PostgreSQL: rejected due to operational overhead and poorer object-lifecycle controls.
  - Persist only object key without integrity metadata: rejected because it weakens corruption detection and auditability.

## Decision 4: Duplicate detection normalization and deterministic concurrency

- Decision: Use explicit title normalization rules from `FR-016`, enforce duplicate checks scoped by `(author_id, conference_cycle_id, normalized_title)` for active statuses, and guarantee single-winner behavior under concurrent requests.
- Rationale: This provides deterministic outcomes and aligns with reliability requirements (`RAR-001`, `RAR-006`).
- Alternatives considered:
  - Best-effort duplicate checks at UI only: rejected due to race-condition risk.
  - Last-write-wins conflict handling: rejected due to non-deterministic duplicate acceptance.

## Decision 5: Authorization and failure response strategy

- Decision: Require valid authenticated author session for submission endpoints and return explicit user-visible error payloads for authorization, validation, and duplicate conflicts.
- Rationale: Aligns with UC-05 alternate flows and constitution mandates for explicit, auditable failures.
- Alternatives considered:
  - Generic failure responses without reason codes: rejected due to weak corrective guidance.
  - Silent drop for duplicate/invalid uploads: rejected by strict validation and error communication policy.

## Decision 6: Submission attempt audit event schema

- Decision: Emit structured audit events for each submission attempt with timestamp, author_id, submission_id (if created), outcome, reason_code, request_id; exclude manuscript content and sensitive metadata.
- Rationale: Satisfies constitution audit gates and `SPR-006` while preserving confidentiality.
- Alternatives considered:
  - Success-only audit logging: rejected because failed-attempt observability is required.
  - Free-text logs without structured fields: rejected due to poor traceability/queryability.
