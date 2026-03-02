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

---

# Backup/Restore Verification: Registration Prices (UC-17)

## Scope
Validate backup and restore reliability for `registration_price_lists` and `registration_prices`.

## Verification Steps
1. Create snapshot backup for production-equivalent database including registration price tables.
2. Restore backup into isolated verification environment.
3. Query the published list and joined price entries and compare row counts against source snapshot.
4. Validate published-list integrity constraints remain intact:
   - only one `PUBLISHED` list is active,
   - a `PUBLISHED` list has `published_at`,
   - each list entry preserves `(price_list_id, attendance_type)` uniqueness.

## Acceptance
- Restored registration price data is queryable and consistent with backup snapshot.
- Public registration price reads return deterministic `200` (published list) or `404` (unavailable list) outcomes after restore.
