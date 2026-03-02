# Author Schedule Recovery

## Scope
UC-16 author schedule access state, including schedule publication and author notification records.

## Backup/Restore Impact
- Restore `schedule_publications` together with linked `conference_schedules` and `schedule_entries` rows.
- Restore `author_notifications` for notification history and user-facing availability evidence.
- Validate that restored rows preserve publication status and notification timestamps.

## Post-Restore Verification
1. Query a published schedule and confirm publication status remains `PUBLISHED`.
2. Invoke `GET /api/author/schedule` for an accepted-paper author and verify a 200 response with presentation details.
3. Validate restored notification records are present and continue to avoid plaintext sensitive fields in logs.
