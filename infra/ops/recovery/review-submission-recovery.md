# UC-10 Review Submission Recovery Checklist

1. Confirm incident scope for review submission write/read impact.
2. Verify latest backup includes `review_submissions` and `review_submission_audits` records.
3. Restore to staging and validate:
   - one final submission per assignment integrity,
   - expected audit trail continuity,
   - no plaintext sensitive review payload leakage.
4. Execute production restore runbook after approval.
5. Re-run UC-10 contract/integration smoke tests and record evidence.
