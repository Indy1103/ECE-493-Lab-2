# Data Model: Author Receive Decision (UC-13)

## Entities

### AuthorDecisionNotification
- **Description**: Notification indicating a final decision is available to the author.
- **Fields**:
  - `paperId` (identifier)
  - `authorId` (identifier)
  - `notificationStatus` (enum: `DELIVERED`, `FAILED`)
  - `sentAt` (timestamp)

### AuthorDecisionView
- **Description**: Author-facing decision access context.
- **Fields**:
  - `paperId`
  - `authorId`
  - `decision` (enum: `ACCEPT`, `REJECT`)
  - `viewedAt` (timestamp, optional)

### DecisionAccessRequest
- **Description**: Author-initiated request to access decision information.
- **Fields**:
  - `paperId`
  - `authorId`
  - `requestTimestamp`

### DecisionOutcome
- **Description**: User-visible outcome for decision access and notification status.
- **Fields**:
  - `outcome` (enum: `DECISION_AVAILABLE`, `NOTIFICATION_FAILED`, `UNAVAILABLE_DENIED`, `SESSION_EXPIRED`)
  - `message`

## Relationships

- `AuthorDecisionNotification` references `paperId` and `authorId`.
- `AuthorDecisionView` references `paperId` and `authorId` and exposes only accept/reject.
- `DecisionAccessRequest` references `paperId` and `authorId`.

## State Transitions

- Notification: `DELIVERED` or `FAILED`.
- Decision view: available once a final decision is recorded.
