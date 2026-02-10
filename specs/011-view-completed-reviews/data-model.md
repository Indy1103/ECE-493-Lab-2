# Data Model: View Completed Paper Reviews

## Entity: PaperReviewSet
Description: Completed referee reviews associated with a submitted paper, returned only when all required reviews are complete.

Fields:
- `paperId` (UUID, required, indexed)
- `completedReviewCount` (integer, required)
- `requiredReviewCount` (integer, required)
- `completedAt` (timestamp, optional)
- `reviews` (array of AnonymizedReviewEntry, required)

Validation rules:
- `completedReviewCount` must equal `requiredReviewCount` to return any review content.
- `reviews` is returned only when completion gating passes.

## Entity: AnonymizedReviewEntry
Description: A completed review entry with evaluation content and no direct referee identity attributes.

Fields:
- `reviewId` (UUID, required, unique)
- `paperId` (UUID, required)
- `summary` (string, required)
- `scores` (object, required)
- `recommendation` (enum: `ACCEPT`, `REJECT`, `BORDERLINE`, required)
- `submittedAt` (timestamp, required)

Validation rules:
- No referee identity attributes are present in this entity.

## Entity: ReviewCompletionStatus
Description: Completion status used to gate visibility of review content.

Fields:
- `paperId` (UUID, required, unique)
- `completedReviewCount` (integer, required)
- `requiredReviewCount` (integer, required)
- `status` (enum: `COMPLETE`, `PENDING`, required)
- `checkedAt` (timestamp, required)

Validation rules:
- `status` must be `COMPLETE` when `completedReviewCount == requiredReviewCount`.
- Status is re-evaluated at request time.

## Entity: EditorialReviewViewRequest
Description: Auditable request context for an editor attempting to view completed reviews.

Fields:
- `requestId` (UUID, required, unique)
- `editorUserId` (UUID, required)
- `paperId` (UUID, required)
- `outcome` (enum: `REVIEWS_VISIBLE`, `REVIEWS_PENDING`, `UNAVAILABLE_DENIED`, `SESSION_EXPIRED`, required)
- `occurredAt` (timestamp, required)

Validation rules:
- An audit record is emitted for every request outcome.
- No review content is stored in audit records.

## Relationships
- `PaperReviewSet` 1:1 `ReviewCompletionStatus` (by `paperId`)
- `PaperReviewSet` 1:N `AnonymizedReviewEntry` (by `paperId`)
- `EditorialReviewViewRequest` N:1 `ReviewCompletionStatus` (by `paperId`)
