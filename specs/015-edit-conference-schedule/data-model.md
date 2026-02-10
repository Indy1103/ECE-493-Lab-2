# Data Model — Edit Conference Schedule

## Entities

### ConferenceSchedule
- **Fields**:
  - `id` (UUID, primary key)
  - `conferenceId` (UUID, required)
  - `status` (enum: `DRAFT`, `FINAL`)
  - `updatedAt` (timestamp)
  - `updatedByEditorId` (UUID, required)
- **Notes**: UC-15 edits transition schedule to `FINAL`.

### ScheduleEntry
- **Fields**:
  - `id` (UUID, primary key)
  - `scheduleId` (UUID, FK -> ConferenceSchedule)
  - `paperId` (UUID, required)
  - `sessionId` (UUID, required)
  - `roomId` (UUID, required)
  - `timeSlotId` (UUID, required)

### ScheduleModificationRequest
- **Fields**:
  - `id` (UUID, primary key)
  - `scheduleId` (UUID, required)
  - `requestedByEditorId` (UUID, required)
  - `requestedAt` (timestamp)
  - `status` (enum: `PENDING`, `APPLIED`, `REJECTED`)

## Relationships
- ConferenceSchedule 1..* ScheduleEntry
- ConferenceSchedule 1..* ScheduleModificationRequest

## Validation Rules
- All modifications must reference existing schedule entries, sessions, rooms, and time slots.
- Invalid modifications must be rejected with no schedule changes.

## State Transitions
- `ConferenceSchedule`: `DRAFT` -> `FINAL` when valid edits are applied and confirmed.
