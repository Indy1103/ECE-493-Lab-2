# UC-13 Author Decision Recovery Checklist

## Data Path Scope

- Decision notification records: `author_decision_notifications`
- Decision access audit records: `author_decision_access_audits`

## Recovery Checklist

1. Confirm incident scope for author decision access and notification delivery states.
2. Verify latest backup snapshot includes both UC-13 data paths.
3. Restore backup to staging.
4. Verify authorization and outcome behavior on restored data:
   - author-only decision access remains enforced;
   - delivered notifications allow decision visibility (`DECISION_AVAILABLE`);
   - failed notifications return explicit notification-failed outcome (`NOTIFICATION_FAILED`);
   - unauthorized or inaccessible requests remain generic (`UNAVAILABLE_DENIED`).
5. Verify audit sanitization on restored data:
   - `authorId` is absent from metadata;
   - decision content is redacted in metadata.
6. Verify encryption-at-rest controls:
   - storage encryption for decision and notification tables is enabled;
   - backup artifacts are encrypted.
7. Re-run UC-13 verification commands:
   - `cd backend && node --import tsx --test "tests/contract/author-decision/*.test.ts"`
   - `cd backend && node --import tsx --test "tests/integration/author-decision/*.test.ts"`
8. Execute production restore runbook after approval and capture post-incident evidence.
