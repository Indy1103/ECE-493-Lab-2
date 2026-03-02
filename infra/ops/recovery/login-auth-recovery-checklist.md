# Login Auth Backup and Restore Checklist (UC-03)

## Scope

- `login_attempts`
- `authenticated_sessions`
- `login_throttle_records`

## Preconditions

- [ ] Confirm backup set includes the three UC-03 auth tables.
- [ ] Confirm backup timestamp and retention policy satisfy RAR-004.
- [ ] Confirm restore target environment is isolated from production traffic.

## Restore Procedure

- [ ] Pause login write traffic to the target environment.
- [ ] Restore database backup snapshot.
- [ ] Validate schema objects for auth tables and indexes.
- [ ] Validate row counts and sample records for each auth table.
- [ ] Verify encrypted-at-rest controls remain enabled after restore.
- [ ] Run UC-03 smoke checks (`200`, `401`, `429`, `503` outcomes).

## Post-Restore Validation

- [ ] Confirm login success and failed-attempt throttling behavior is operational.
- [ ] Confirm no plaintext credential values appear in restored auth records.
- [ ] Capture restore duration and outcome in recovery log.
- [ ] Record incident ticket or drill reference for audit traceability.
