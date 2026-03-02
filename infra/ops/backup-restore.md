# Backup and Restore Coverage Notes

## Scope

The backup and restore process must include all tables introduced by implemented use cases, including UC-06 draft persistence, UC-07 referee assignment flows, UC-08 invitation response recording, and UC-09 assigned-paper access.

## Draft Persistence Tables (UC-06)

- `submission_drafts`
- `draft_snapshots`
- `draft_save_attempts`

## Referee Assignment Tables (UC-07)

- `referee_assignments`
- `review_invitations`
- `assignment_attempt_audits`

## Review Invitation Response Tables (UC-08)

- `invitation_response_attempts`
- `review_invitations` (`response_status`, `response_recorded_at`)
- `referee_assignments` (`source_invitation_id`)

## Assigned Paper Access Tables (UC-09)

- `paper_access_resources`
- `review_form_access`
- `assigned_paper_access_audits`
- `referee_assignments` (assigned-paper linkage and availability columns)

## Backup Requirements

- Include the UC-06 tables in scheduled PostgreSQL backups.
- Include the UC-07 tables in scheduled PostgreSQL backups.
- Include the UC-08 invitation-response attempt records and linked columns in scheduled PostgreSQL backups.
- Include the UC-09 paper-access resource, review-form access, and access-audit tables in scheduled PostgreSQL backups.
- Keep backup encryption enabled for all persisted draft data.
- Keep backup encryption enabled for persisted assignment and invitation records.
- Keep backup encryption enabled for persisted invitation-response attempts and source-invitation assignment links.
- Keep backup encryption enabled for UC-09 assignment/paper/form linkage records and assigned-paper access audits.
- Verify backup metadata tracks schema version and backup timestamp.

## Restore Verification Steps

- Restore `submission_drafts`, `draft_snapshots`, and `draft_save_attempts` into an isolated environment.
- Restore `referee_assignments`, `review_invitations`, and `assignment_attempt_audits` into an isolated environment.
- Restore `invitation_response_attempts` with `review_invitations` and `referee_assignments` linkage into an isolated environment.
- Restore `paper_access_resources`, `review_form_access`, and `assigned_paper_access_audits` with linked `referee_assignments` into an isolated environment.
- Verify foreign-key integrity between snapshots and current drafts.
- Verify assignment-to-invitation linkage integrity and assignment-attempt audit retention.
- Verify invitation-response attempt linkage to `review_invitations` and one-to-one `source_invitation_id` uniqueness on `referee_assignments`.
- Verify assigned-paper access audit linkage to `referee_assignments`, `paper_access_resources`, and `review_form_access`.
- Validate one-current-draft uniqueness on `(author_id, in_progress_submission_id)`.
- Validate unique active assignment constraint on `(paper_id, referee_id)` remains enforced.
- Confirm restored draft records preserve `policy_version` and `payload_version`.
- Confirm encrypted-at-rest controls remain enabled after restore.

## Operational Evidence

- Record restore drill ID, operator, and duration.
- Capture row-count parity checks for all UC-06 draft tables.
- Capture row-count parity checks for all UC-07 assignment/invitation/audit tables.
- Capture row-count parity checks for UC-08 `invitation_response_attempts` and linked `review_invitations` response columns.
- Capture row-count parity checks for UC-09 `paper_access_resources`, `review_form_access`, and `assigned_paper_access_audits`.
- Capture pass/fail evidence for post-restore draft save and resume smoke tests.
- Capture pass/fail evidence for post-restore referee assignment and invitation retry smoke tests.
- Capture pass/fail evidence for post-restore invitation accept/reject and recording-failure retry smoke tests.
- Capture pass/fail evidence for post-restore assigned-paper listing and paper+form atomic access smoke tests.
