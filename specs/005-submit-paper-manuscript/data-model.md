# Data Model: Submit Paper Manuscript (UC-05)

## Entity: ManuscriptSubmission

Purpose: Canonical submission record for one author manuscript attempt accepted into review intake.

Fields:
- id (UUID, PK)
- author_id (UUID, FK -> User.id, indexed)
- conference_cycle_id (UUID, FK -> ConferenceCycle.id, indexed)
- status (enum: DRAFT, SUBMITTED, UNDER_REVIEW, REVISION_REQUESTED, WITHDRAWN, REJECTED, ARCHIVED)
- normalized_title (string, non-null, indexed)
- metadata_policy_version (string, non-null, example: CMS Manuscript Submission Policy v1.0)
- manuscript_artifact_id (UUID, FK -> ManuscriptArtifact.id, non-null)
- created_at (timestamp, non-null)
- updated_at (timestamp, non-null)

Validation rules:
- `status` transitions must follow allowed workflow.
- `normalized_title` must be produced using FR-016 normalization sequence.
- Active duplicate scope is `(author_id, conference_cycle_id, normalized_title)` when status in `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUESTED`.

State transitions:
- New successful submission -> SUBMITTED.
- SUBMITTED -> UNDER_REVIEW when referee workflow begins (downstream).
- UNDER_REVIEW -> REVISION_REQUESTED or REJECTED (downstream).
- Any active state -> WITHDRAWN (authorized flow outside current feature).
- Terminal archival transition -> ARCHIVED.

## Entity: SubmissionMetadataPackage

Purpose: Structured required metadata validated at submission time.

Fields:
- submission_id (UUID, PK, FK -> ManuscriptSubmission.id)
- title (string, non-null)
- abstract (text, non-null)
- keywords (string array, non-null, min 1)
- full_author_list (json array/object, non-null)
- corresponding_author_email (string, non-null)
- primary_subject_area (string, non-null)
- captured_at (timestamp, non-null)

Validation rules:
- Required fields must match fixed-cycle policy (`CMS Manuscript Submission Policy v1.0`).
- `corresponding_author_email` must be valid email syntax.
- `title` source value must map to `normalized_title` in parent submission.

Relationships:
- ManuscriptSubmission 1 -> 1 SubmissionMetadataPackage.

## Entity: ManuscriptArtifact

Purpose: Reference and integrity envelope for manuscript file stored in encrypted object storage.

Fields:
- id (UUID, PK)
- storage_object_key (string, unique, non-null)
- media_type (string, non-null, must equal `application/pdf`)
- byte_size (integer, non-null, max 20 * 1024 * 1024)
- sha256_digest (string, non-null)
- uploaded_at (timestamp, non-null)

Validation rules:
- Only PDF media type accepted.
- File size must be <= 20 MB.
- Digest must be present before accepted submission persistence.

Relationships:
- ManuscriptSubmission many -> 1 ManuscriptArtifact (current scope effectively 1:1 per submission).

## Entity: SubmissionAttemptAudit

Purpose: Auditable record of each submission attempt outcome.

Fields:
- id (UUID, PK)
- author_id (UUID, FK -> User.id, nullable for unauthenticated attempt)
- submission_id (UUID, FK -> ManuscriptSubmission.id, nullable)
- request_id (string, non-null)
- outcome (enum: SUCCESS, AUTHZ_FAILED, METADATA_INVALID, FILE_INVALID, DUPLICATE_REJECTED, INTAKE_CLOSED, OPERATIONAL_FAILED)
- reason_code (string, non-null)
- occurred_at (timestamp, non-null)

Validation rules:
- Must never contain manuscript content or sensitive metadata payload.
- One audit row per submission attempt outcome.

## Entity: ConferenceCycle

Purpose: Binds policy version and intake window state for submission decisions.

Fields:
- id (UUID, PK)
- intake_status (enum: OPEN, CLOSED)
- metadata_policy_version (string, non-null)
- starts_at (timestamp, non-null)
- ends_at (timestamp, non-null)

Relationships:
- ConferenceCycle 1 -> many ManuscriptSubmission.

## Invariants

- Submission acceptance is atomic: metadata + artifact reference + submission record must all persist together or not at all.
- Duplicate active submissions by same author and normalized title in same cycle are not allowed.
- Failed validation/authorization/operational outcomes must not produce accepted submission state.
- Concurrency conflicts for duplicate submissions resolve deterministically with single-winner behavior.
