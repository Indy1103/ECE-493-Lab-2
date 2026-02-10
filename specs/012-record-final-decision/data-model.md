# Data Model: Record Final Decision (UC-12)

## Entities

### PaperDecision
- **Description**: Final acceptance or rejection outcome recorded for a paper.
- **Fields**:
  - `paperId` (identifier, unique per paper)
  - `decision` (enum: `ACCEPT`, `REJECT`)
  - `decidedAt` (timestamp)
  - `decidedByEditorId` (identifier)
  - `isFinal` (boolean, always true once recorded)
- **Rules**:
  - One final decision per paper.
  - Decisions are immutable once recorded.

### DecisionRequest
- **Description**: Editor-initiated request to record a final decision.
- **Fields**:
  - `paperId`
  - `requestedDecision` (enum: `ACCEPT`, `REJECT`)
  - `requesterEditorId`
  - `requestTimestamp`

### ReviewCompletionStatus
- **Description**: Paper-level review completion state used to gate decisions.
- **Fields**:
  - `paperId`
  - `requiredReviewCount`
  - `completedReviewCount`
  - `status` (enum: `COMPLETE`, `PENDING`)

### DecisionOutcome
- **Description**: User-visible outcome for decision recording requests.
- **Fields**:
  - `outcome` (enum: `DECISION_RECORDED`, `REVIEWS_PENDING`, `UNAVAILABLE_DENIED`, `SESSION_EXPIRED`)
  - `message`

## Relationships

- `PaperDecision` belongs to a single `paperId` and is created only when `ReviewCompletionStatus.status = COMPLETE`.
- `DecisionRequest` references `paperId` and `requesterEditorId`.
- `ReviewCompletionStatus` is derived from existing review data for the paper.

## State Transitions

- `ReviewCompletionStatus`: `PENDING` → `COMPLETE` when required reviews are satisfied.
- `PaperDecision`: absent → recorded once, immutable thereafter.
