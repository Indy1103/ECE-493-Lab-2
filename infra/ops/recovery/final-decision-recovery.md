# UC-12 Final Decision Recovery Checklist

1. Confirm incident scope for final decision write/read access and audit trail continuity.
2. Verify the latest backup includes `final_decisions` and `final_decision_audits` records.
3. Restore to staging and verify:
   - one immutable final decision per paper,
   - pending-review requests remain blocked with no decision record created,
   - successful decisions preserve author-notification outcome status,
   - audit metadata remains redacted for request payloads and author identifiers.
4. Verify encrypted-at-rest controls are enabled for restored decision and audit data paths.
5. Run UC-12 contract and integration smoke tests on the restored environment.
6. Execute production restore runbook after approval and capture evidence for post-incident review.
