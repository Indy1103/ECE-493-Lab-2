# Data Model: Access Assigned Paper for Review

## Entity: RefereeAssignment
Description: Mapping that grants a referee access to review a specific paper.

Fields:
- `id` (UUID, required, unique)
- `refereeUserId` (UUID, required, indexed)
- `paperId` (UUID, required, indexed)
- `reviewFormId` (UUID, required)
- `status` (enum: `ACTIVE`, `UNAVAILABLE`, `REVOKED`, required)
- `invitationStatus` (enum: `ACCEPTED`, `PENDING`, `REJECTED`, required)
- `assignedAt` (timestamp, required)
- `updatedAt` (timestamp, required)

Validation rules:
- Access is valid only when `invitationStatus=ACCEPTED` and `status=ACTIVE`.
- Composite ownership uniqueness: one active assignment per (`refereeUserId`, `paperId`).
- Non-owner access attempts must not reveal existence of assignment.

State transitions:
- `PENDING -> ACCEPTED` (via UC-08 acceptance)
- `ACTIVE -> UNAVAILABLE` (paper removed or review window closed)
- `ACTIVE -> REVOKED` (editorial/security revocation)

## Entity: PaperAccessResource
Description: Access metadata for a paper visible to an assigned referee.

Fields:
- `paperId` (UUID, required)
- `title` (string, required)
- `abstractPreview` (string, optional)
- `fileObjectKey` (string, required, sensitive)
- `availability` (enum: `AVAILABLE`, `UNAVAILABLE`, required)
- `lastAvailabilityCheckAt` (timestamp, required)

Validation rules:
- `availability=AVAILABLE` required before retrieval.
- File object key never returned to clients in plaintext.

## Entity: ReviewFormAccess
Description: Review form context linked to assignment and paper.

Fields:
- `reviewFormId` (UUID, required, unique)
- `paperId` (UUID, required)
- `refereeUserId` (UUID, required)
- `schemaVersion` (string, required)
- `status` (enum: `READY`, `UNAVAILABLE`, required)

Validation rules:
- Review form must be `READY` for successful access.
- If review form is unavailable, paper access for that request is denied atomically.

## Entity: AssignedPaperAccessAuditEvent
Description: Structured audit trail for assigned-paper access attempts.

Fields:
- `eventId` (UUID, required, unique)
- `actorUserId` (UUID, required)
- `paperId` (UUID, optional for list operations)
- `assignmentId` (UUID, optional)
- `outcome` (enum: `SUCCESS`, `NO_ASSIGNMENTS`, `UNAVAILABLE`, `UNAVAILABLE_OR_NOT_FOUND`, `SESSION_EXPIRED`, `FORM_UNAVAILABLE`, required)
- `reasonCode` (string, required)
- `occurredAt` (timestamp, required)

Validation rules:
- No plaintext sensitive content in event payload.
- Every success/failure path emits one auditable event.

## Relationships
- `RefereeAssignment` 1:1 `ReviewFormAccess` (for active review context)
- `RefereeAssignment` N:1 `PaperAccessResource`
- `AssignedPaperAccessAuditEvent` N:1 `RefereeAssignment` (optional for no-assignment/session-expired paths)
