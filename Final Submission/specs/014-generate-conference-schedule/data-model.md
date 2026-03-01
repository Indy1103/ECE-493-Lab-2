# Data Model — Generate Conference Schedule

## Entities

### ConferenceSchedule
- **Fields**:
  - `id` (UUID, primary key)
  - `conferenceId` (UUID, required)
  - `status` (enum: `DRAFT`, `FINAL`)
  - `generatedAt` (timestamp)
  - `generatedByAdminId` (UUID, required)
  - `orderingRule` (string, default: `submission_time`)
- **Notes**: Draft schedules for UC-14 are `DRAFT` only.

### ScheduleEntry
- **Fields**:
  - `id` (UUID, primary key)
  - `scheduleId` (UUID, FK -> ConferenceSchedule)
  - `paperId` (UUID, required)
  - `orderIndex` (integer, required)
- **Notes**: No session/time assignments in UC-14 scope.

### AcceptedPaper
- **Fields**:
  - `id` (UUID, primary key)
  - `title` (string, required)
  - `submissionTime` (timestamp, required)
  - `decisionStatus` (enum, required; must be `ACCEPTED`)

## Relationships
- ConferenceSchedule 1..* ScheduleEntry
- ScheduleEntry *..1 AcceptedPaper

## Validation Rules
- Schedule generation requires at least one `AcceptedPaper` with `decisionStatus = ACCEPTED`.
- `orderIndex` must be contiguous starting at 1, sorted by `AcceptedPaper.submissionTime` ascending.
- `ConferenceSchedule.status` must be `DRAFT` for this feature.

## State Transitions
- `ConferenceSchedule`: `DRAFT` created on generation; finalization occurs in UC-15 (out of scope).
