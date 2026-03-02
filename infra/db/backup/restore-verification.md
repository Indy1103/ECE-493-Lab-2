# Backup/Restore Verification: Public Announcements

## Scope
Validate backup and restore reliability for `conference_announcements` data.

## Verification Steps
1. Create snapshot backup for production-equivalent database.
2. Restore backup into isolated verification environment.
3. Run read query for public eligibility window and compare row counts against source snapshot.
4. Validate schema constraints (`publish_end >= publish_start`) remain intact.

## Acceptance
- Restored data is queryable and consistent with backup snapshot.
- Public announcement reads return deterministic `AVAILABLE`/`EMPTY` outcomes after restore.
