# Manuscript Submission Backup and Restore Checklist (UC-05)

## Scope

- `manuscript_submissions`
- `submission_metadata_packages`
- `manuscript_artifacts`
- `submission_attempt_audits`

## Preconditions

- [ ] Confirm backup set includes all four UC-05 tables.
- [ ] Confirm encrypted object-storage snapshot includes manuscript artifact objects.
- [ ] Confirm restore target environment is isolated from production traffic.

## Restore Procedure

- [ ] Pause manuscript submission write traffic for the restore target.
- [ ] Restore PostgreSQL snapshot containing UC-05 tables and indexes.
- [ ] Restore encrypted object-storage artifacts referenced by `manuscript_artifacts.storage_object_key`.
- [ ] Validate referential integrity: `manuscript_submissions.manuscript_artifact_id` -> `manuscript_artifacts.id`.
- [ ] Validate row-count parity for submissions, metadata packages, artifact rows, and audits.
- [ ] Verify encrypted-at-rest controls remain enabled after restore.
- [ ] Run UC-05 smoke checks (`201`, `400`, `409`, `413`, `415`, `426`, and `500` outcomes).

## Post-Restore Validation

- [ ] Confirm accepted submissions remain downstream-available after restore.
- [ ] Confirm duplicate protection still enforces deterministic single-winner behavior.
- [ ] Confirm no plaintext manuscript content appears in logs or restored metadata snapshots.
- [ ] Capture restore duration, ticket/drill ID, and operator sign-off for audit traceability.
