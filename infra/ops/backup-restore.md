# Backup and Restore Coverage Notes

## Scope

The backup and restore process must include all tables introduced by implemented use cases, including UC-06 draft persistence and UC-07 referee assignment flows.

## Draft Persistence Tables (UC-06)

- `submission_drafts`
- `draft_snapshots`
- `draft_save_attempts`

## Referee Assignment Tables (UC-07)

- `referee_assignments`
- `review_invitations`
- `assignment_attempt_audits`

## Backup Requirements

- Include the UC-06 tables in scheduled PostgreSQL backups.
- Include the UC-07 tables in scheduled PostgreSQL backups.
- Keep backup encryption enabled for all persisted draft data.
- Keep backup encryption enabled for persisted assignment and invitation records.
- Verify backup metadata tracks schema version and backup timestamp.

## Restore Verification Steps

- Restore `submission_drafts`, `draft_snapshots`, and `draft_save_attempts` into an isolated environment.
- Restore `referee_assignments`, `review_invitations`, and `assignment_attempt_audits` into an isolated environment.
- Verify foreign-key integrity between snapshots and current drafts.
- Verify assignment-to-invitation linkage integrity and assignment-attempt audit retention.
- Validate one-current-draft uniqueness on `(author_id, in_progress_submission_id)`.
- Validate unique active assignment constraint on `(paper_id, referee_id)` remains enforced.
- Confirm restored draft records preserve `policy_version` and `payload_version`.
- Confirm encrypted-at-rest controls remain enabled after restore.

## Operational Evidence

- Record restore drill ID, operator, and duration.
- Capture row-count parity checks for all UC-06 draft tables.
- Capture row-count parity checks for all UC-07 assignment/invitation/audit tables.
- Capture pass/fail evidence for post-restore draft save and resume smoke tests.
- Capture pass/fail evidence for post-restore referee assignment and invitation retry smoke tests.
