# Data Model: Generate Conference Schedule (UC-14)

## Entities

## AcceptedPaper
- `paperId: string`
- `title: string`
- `authorId: string`
- `decision: "ACCEPT"`

## ConferenceSchedule
- `conferenceId: string`
- `version: number`
- `generatedByAdminId: string`
- `generatedAt: string` (ISO8601)
- `entries: ScheduleEntry[]`

## ScheduleEntry
- `paperId: string`
- `sessionCode: string`
- `roomCode: string`
- `startTime: string` (ISO8601)
- `endTime: string` (ISO8601)

## ScheduleGenerationRequest
- `conferenceId: string`
- `requestId: string`
- `adminUserId: string`

## Relationships
- `ConferenceSchedule.entries[*].paperId` references `AcceptedPaper.paperId`
- Each accepted paper appears exactly once in generated schedule output
