# Data Model: Submit Paper Review

## Entity: ReviewSubmission
Description: Final persisted review submitted by a referee for an assigned paper.

Fields:
- `id` (UUID, required, unique)
- `assignmentId` (UUID, required, unique)
- `paperId` (UUID, required, indexed)
- `refereeUserId` (UUID, required, indexed)
- `content` (structured object, required)
- `status` (enum: `SUBMITTED`, required)
- `submittedAt` (timestamp, required)
- `updatedAt` (timestamp, required)

Validation rules:
- Exactly one final `ReviewSubmission` may exist per `assignmentId`.
- Submission is valid only for assignment owned by `refereeUserId` with accepted invitation state.
- Record may be created only after required and domain validation succeeds.

State transitions:
- `SUBMITTED` is terminal for final submission in this feature scope.

## Entity: ReviewFormDefinition
Description: Structured field rules for review submission.

Fields:
- `id` (UUID, required, unique)
- `paperId` (UUID, required, indexed)
- `requiredFields` (array, required)
- `domainRules` (array, required)
- `version` (string, required)

Validation rules:
- Required fields must be present and domain constraints satisfied before recording submission.

## Entity: AssignmentEligibility
Description: Authorization and eligibility context used at submission time.

Fields:
- `assignmentId` (UUID, required, unique)
- `paperId` (UUID, required)
- `refereeUserId` (UUID, required)
- `invitationStatus` (enum: `ACCEPTED`, `PENDING`, `REJECTED`, required)
- `submissionEligibility` (enum: `ELIGIBLE`, `INELIGIBLE`, required)
- `eligibilityCheckedAt` (timestamp, required)

Validation rules:
- Submission permitted only when `invitationStatus=ACCEPTED` and `submissionEligibility=ELIGIBLE`.
- Eligibility must be revalidated at submit time.

## Entity: ReviewSubmissionAuditEvent
Description: Structured audit record for submission attempts and outcomes.

Fields:
- `eventId` (UUID, required, unique)
- `actorUserId` (UUID, required)
- `assignmentId` (UUID, optional)
- `paperId` (UUID, optional)
- `outcome` (enum: `submitted`, `validation-failed`, `session-expired`, `submission-unavailable`, required)
- `reasonCode` (string, required)
- `occurredAt` (timestamp, required)

Validation rules:
- Audit event emitted for every successful and failed submission attempt.
- Event payload excludes plaintext review content and sensitive identity-linkage details.

## Relationships
- `ReviewSubmission` 1:1 `AssignmentEligibility` (via `assignmentId` at accepted final submission)
- `ReviewSubmission` N:1 `ReviewFormDefinition` (by `paperId` + form version)
- `ReviewSubmissionAuditEvent` N:1 `AssignmentEligibility` (optional for non-enumerating denial/session-expired paths)
