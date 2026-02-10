# Data Model: Save Paper Submission Draft (UC-06)

## Entity: SubmissionDraft

Purpose: Canonical current draft state for one author and one in-progress submission.

Fields:
- id (UUID, PK)
- author_id (UUID, FK -> User.id, indexed)
- in_progress_submission_id (UUID, FK -> PaperSubmission.id, indexed)
- title (string, non-null)
- draft_payload (json, non-null)
- payload_version (integer, non-null)
- last_saved_at (timestamp, non-null)

Validation rules:
- `title` is required and non-empty for successful draft save.
- `draft_payload` must satisfy provided-field validation rules.
- Exactly one current draft per `(author_id, in_progress_submission_id)`.

Relationships:
- User 1 -> many SubmissionDraft.
- PaperSubmission 1 -> 1 SubmissionDraft (current scope while in-progress).

State transitions:
- Absent -> Saved on first successful draft save.
- Saved(vN) -> Saved(vN+1) on subsequent successful saves.
- Saved(vN) -> Saved(vN) on validation or operational failure.

## Entity: DraftSnapshot

Purpose: Versioned historical snapshot of saved draft content at successful save points.

Fields:
- id (UUID, PK)
- submission_draft_id (UUID, FK -> SubmissionDraft.id, indexed)
- version (integer, non-null)
- snapshot_payload (json, non-null)
- saved_at (timestamp, non-null)

Validation rules:
- Version increments monotonically per `submission_draft_id`.
- Snapshot is written only for successful save outcomes.

Relationships:
- SubmissionDraft 1 -> many DraftSnapshot.

## Entity: DraftSaveAttempt

Purpose: Auditable record of each draft save request outcome.

Fields:
- id (UUID, PK)
- author_id (UUID, FK -> User.id, nullable for unauthenticated attempt)
- in_progress_submission_id (UUID, FK -> PaperSubmission.id, nullable)
- outcome (enum: SUCCESS, VALIDATION_FAILED, AUTHZ_FAILED, OPERATIONAL_FAILED)
- reason_code (string, non-null)
- request_id (string, non-null)
- occurred_at (timestamp, non-null)

Validation rules:
- Payload content must never be persisted in this entity.
- One attempt record per draft-save request.

## Invariants

- A failed validation or failed operation must not replace the last saved valid draft.
- Concurrent valid saves for the same draft resolve deterministically with last-write-wins semantics.
- Save/resume access is restricted to the owning author.
