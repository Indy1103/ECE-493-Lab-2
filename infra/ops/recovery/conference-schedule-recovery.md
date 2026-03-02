# UC-14 Conference Schedule Recovery Checklist

1. Confirm incident scope for schedule generation and retrieval paths.
2. Verify latest backup includes `conference_schedules` and `conference_schedule_audits`.
3. Restore backup to staging and verify:
   - admin-only generation remains enforced,
   - accepted papers produce `SCHEDULE_GENERATED`,
   - empty accepted-paper sets return `NO_ACCEPTED_PAPERS`,
   - metadata redaction excludes paper titles from audit payloads.
4. Verify encryption-at-rest controls are enabled for schedule and audit records.
5. Re-run UC-14 contract and integration smoke tests.
6. Execute production restore runbook and capture evidence.
