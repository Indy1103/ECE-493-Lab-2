# Backup and Restore Coverage Notes

## Scope

The backup and restore process must include all tables introduced by implemented use cases, including UC-06 draft persistence.

## Draft Persistence Tables (UC-06)

- `submission_drafts`
- `draft_snapshots`
- `draft_save_attempts`

## Backup Requirements

- Include the UC-06 tables in scheduled PostgreSQL backups.
- Keep backup encryption enabled for all persisted draft data.
- Verify backup metadata tracks schema version and backup timestamp.

## Restore Verification Steps

- Restore `submission_drafts`, `draft_snapshots`, and `draft_save_attempts` into an isolated environment.
- Verify foreign-key integrity between snapshots and current drafts.
- Validate one-current-draft uniqueness on `(author_id, in_progress_submission_id)`.
- Confirm restored draft records preserve `policy_version` and `payload_version`.
- Confirm encrypted-at-rest controls remain enabled after restore.

## Operational Evidence

- Record restore drill ID, operator, and duration.
- Capture row-count parity checks for all UC-06 draft tables.
- Capture pass/fail evidence for post-restore draft save and resume smoke tests.
