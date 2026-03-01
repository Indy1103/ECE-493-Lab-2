# Data Model: Respond to Review Invitation (UC-08)

## Entity: ReviewInvitation

Purpose: Decision-bearing invitation issued to a specific referee for a specific paper.

Fields:
- id (UUID, PK)
- paper_id (UUID, FK -> PaperSubmission.id, indexed)
- referee_id (UUID, FK -> User.id, indexed)
- invitation_status (enum: PENDING, ACCEPTED, REJECTED, EXPIRED)
- review_due_at (timestamp, non-null)
- response_deadline_at (timestamp, non-null)
- resolved_at (timestamp, nullable)
- version (integer, non-null, for optimistic guard if needed)

Validation rules:
- Only invitations with `invitation_status = PENDING` can receive referee responses.
- Exactly one terminal resolved state (`ACCEPTED` or `REJECTED`) is allowed per invitation.
- Invitation must belong to the authenticated referee for response submission.

Relationships:
- PaperSubmission 1 -> many ReviewInvitation.
- User (role=REFEREE) 1 -> many ReviewInvitation.
- ReviewInvitation 1 -> many InvitationResponseAttempt.

State transitions:
- PENDING -> ACCEPTED on first valid accept response.
- PENDING -> REJECTED on first valid reject response.
- PENDING -> EXPIRED by schedule/policy outside direct response flow.
- ACCEPTED/REJECTED -> no further referee response transitions.

## Entity: InvitationResponseAttempt

Purpose: Auditable record of each referee response submission outcome.

Fields:
- id (UUID, PK)
- invitation_id (UUID, FK -> ReviewInvitation.id, indexed)
- referee_id (UUID, FK -> User.id, nullable for auth failure)
- decision_requested (enum: ACCEPT, REJECT)
- outcome (enum: SUCCESS_ACCEPTED, SUCCESS_REJECTED, REJECTED_ALREADY_RESOLVED, AUTHZ_FAILED, RECORDING_FAILED)
- reason_code (string, non-null)
- request_id (string, non-null)
- occurred_at (timestamp, non-null)

Validation rules:
- One attempt record per response submission request.
- Sensitive reviewer profile data must not be persisted in attempt payload fields.

Relationships:
- ReviewInvitation 1 -> many InvitationResponseAttempt.

## Entity: RefereeAssignment

Purpose: Active reviewer-to-paper association created only when an invitation is accepted.

Fields:
- id (UUID, PK)
- paper_id (UUID, FK -> PaperSubmission.id, indexed)
- referee_id (UUID, FK -> User.id, indexed)
- source_invitation_id (UUID, FK -> ReviewInvitation.id, unique)
- assignment_status (enum: ACTIVE, WITHDRAWN, COMPLETED)
- assigned_at (timestamp, non-null)

Validation rules:
- Assignment is created only on successful invitation acceptance.
- No assignment row is created or retained from failed response-recording attempts.

Relationships:
- ReviewInvitation 1 -> 0..1 RefereeAssignment.
- User (role=REFEREE) 1 -> many RefereeAssignment.
- PaperSubmission 1 -> many RefereeAssignment.

State transitions:
- NotExists -> ACTIVE on successful accept response.
- ACTIVE -> WITHDRAWN/COMPLETED in downstream review workflow.

## Invariants

- First valid response wins for each invitation; later responses are rejected as already resolved.
- Rejection outcomes never create active referee assignment.
- Recording failure leaves invitation pending and preserves no assignment side effects.
