# Data Model: Assign Referees to Submitted Papers (UC-07)

## Entity: PaperAssignmentCandidate

Purpose: Assignment-ready view of a submitted paper and current assignment capacity under conference policy.

Fields:
- paper_id (UUID, PK/FK -> PaperSubmission.id)
- conference_cycle_id (UUID, FK -> ConferenceCycle.id, indexed)
- workflow_state (enum: AWAITING_ASSIGNMENT, IN_REVIEW, CLOSED)
- max_referees_per_paper (integer, non-null)
- current_assigned_referee_count (integer, non-null)
- remaining_slots (integer, computed)
- lock_version (integer or transaction lock handle)

Validation rules:
- Assignment allowed only when `workflow_state = AWAITING_ASSIGNMENT`.
- `remaining_slots = max_referees_per_paper - current_assigned_referee_count` must be >= requested unique referee count.

Relationships:
- ConferenceCycle 1 -> many PaperAssignmentCandidate.
- PaperAssignmentCandidate 1 -> many RefereeAssignment.

State transitions:
- AWAITING_ASSIGNMENT -> AWAITING_ASSIGNMENT when assignments are added but review not yet started.
- AWAITING_ASSIGNMENT -> IN_REVIEW when downstream workflow marks review phase active.

## Entity: RefereeWorkloadProfile

Purpose: Tracks assignable referee capacity for the relevant conference cycle.

Fields:
- referee_id (UUID, PK/FK -> User.id)
- conference_cycle_id (UUID, FK -> ConferenceCycle.id)
- max_active_assignments (integer, non-null)
- current_active_assignments (integer, non-null)
- availability_status (enum: ELIGIBLE, INELIGIBLE)

Validation rules:
- Referee must be `ELIGIBLE`.
- `current_active_assignments < max_active_assignments` required for new assignment.

Relationships:
- User (role=REFEREE) 1 -> many RefereeWorkloadProfile (by cycle).
- RefereeWorkloadProfile 1 -> many RefereeAssignment.

## Entity: RefereeAssignment

Purpose: Authoritative assignment link between a paper and referee.

Fields:
- id (UUID, PK)
- paper_id (UUID, FK -> PaperSubmission.id, indexed)
- referee_id (UUID, FK -> User.id, indexed)
- assigned_by_editor_id (UUID, FK -> User.id)
- assignment_status (enum: ASSIGNED, INVITED, DECLINED, COMPLETED)
- assigned_at (timestamp, non-null)
- conference_cycle_id (UUID, FK -> ConferenceCycle.id)

Validation rules:
- Unique active assignment per `(paper_id, referee_id)`.
- Insert allowed only when paper capacity and referee workload validations pass for entire request set.
- No assignment rows created for failed requests (atomicity).

Relationships:
- PaperAssignmentCandidate 1 -> many RefereeAssignment.
- RefereeWorkloadProfile 1 -> many RefereeAssignment.

State transitions:
- ASSIGNED -> INVITED after invitation dispatch success.
- ASSIGNED -> ASSIGNED when invitation is pending/retryable failure.
- INVITED -> COMPLETED or DECLINED by later review workflow.

## Entity: ReviewInvitation

Purpose: Invitation intent and delivery status for assigned referees.

Fields:
- id (UUID, PK)
- assignment_id (UUID, FK -> RefereeAssignment.id, indexed)
- referee_id (UUID, FK -> User.id)
- invitation_status (enum: PENDING, SENT, FAILED_RETRYABLE, FAILED_FINAL)
- attempt_count (integer, non-null, default 0)
- last_attempt_at (timestamp, nullable)
- failure_reason_code (string, nullable)
- created_at (timestamp, non-null)

Validation rules:
- Invitation record is created for every successfully committed assignment.
- Invitation delivery failure must not delete or roll back `RefereeAssignment`.

Relationships:
- RefereeAssignment 1 -> 1 ReviewInvitation (current scope).

State transitions:
- PENDING -> SENT on successful delivery.
- PENDING/SENT -> FAILED_RETRYABLE on transient dispatch failure.
- FAILED_RETRYABLE -> SENT on later retry success.
- FAILED_RETRYABLE -> FAILED_FINAL after retry budget exhausted.

## Entity: AssignmentAttemptAudit

Purpose: Auditable record of assignment request outcomes.

Fields:
- id (UUID, PK)
- request_id (string, non-null)
- paper_id (UUID, FK -> PaperSubmission.id)
- editor_id (UUID, FK -> User.id, nullable for auth failures)
- submitted_referee_ids_count (integer, non-null)
- outcome (enum: SUCCESS, VALIDATION_FAILED, AUTHN_FAILED, AUTHZ_FAILED, INVITATION_RETRYABLE_FAILURE)
- reason_code (string, non-null)
- occurred_at (timestamp, non-null)

Validation rules:
- Must not include sensitive referee profile data or plaintext invitation content.
- One audit record per assignment request outcome.

## Invariants

- Duplicate referee IDs in a single request produce validation failure and no new assignments.
- Any validation failure in a multi-referee request fails the whole request and persists zero assignments from that request.
- Concurrent assignment attempts for the same paper are serialized so capacity/workload checks are evaluated with a consistent state snapshot.
- Persisted assignments remain committed even when downstream invitation dispatch fails.
