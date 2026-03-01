# Data Model — Author Schedule Access

## Entities

### ConferenceSchedule
- **Fields**:
  - `id` (UUID, primary key)
  - `conferenceId` (UUID, required)
  - `status` (enum: `DRAFT`, `FINAL`)
  - `updatedAt` (timestamp)
- **Notes**: Schedule is viewable by authors only when status is `FINAL`.

### ScheduleEntry
- **Fields**:
  - `id` (UUID, primary key)
  - `scheduleId` (UUID, FK -> ConferenceSchedule)
  - `paperId` (UUID, required)
  - `sessionId` (UUID, required)
  - `roomId` (UUID, required)
  - `timeSlotId` (UUID, required)

### SchedulePublication
- **Fields**:
  - `id` (UUID, primary key)
  - `scheduleId` (UUID, required)
  - `publishedAt` (timestamp)
  - `publishedByEditorId` (UUID, required)
  - `status` (enum: `PUBLISHED`)

### AuthorNotification
- **Fields**:
  - `id` (UUID, primary key)
  - `authorId` (UUID, required)
  - `scheduleId` (UUID, required)
  - `notifiedAt` (timestamp)
  - `status` (enum: `SENT`, `FAILED`)

## Relationships
- ConferenceSchedule 1..* ScheduleEntry
- ConferenceSchedule 1..1 SchedulePublication
- ConferenceSchedule 1..* AuthorNotification

## Validation Rules
- Schedule access is allowed only when `SchedulePublication.status = PUBLISHED`.
- Author notifications are recorded for authors with accepted papers when publication occurs.

## State Transitions
- `SchedulePublication`: `DRAFT` -> `PUBLISHED` when the final schedule is published.
