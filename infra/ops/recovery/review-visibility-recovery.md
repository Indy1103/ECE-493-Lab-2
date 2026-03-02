# UC-11 Review Visibility Recovery Checklist

1. Confirm incident scope for completed-review read access and audit trail integrity.
2. Verify latest backup includes review records and `review_visibility_audits` entries.
3. Restore to staging and validate:
   - completed vs required review counts are consistent,
   - pending outcomes return no review content,
   - visible outcomes return anonymized reviews only,
   - audit metadata remains redacted for review payloads/referee identifiers,
   - encrypted-at-rest controls remain enabled for restored review and audit data.
4. Validate transport security for `/api/editor/papers/{paperId}/reviews` before production cutover.
5. Execute production restore runbook after approval.
6. Re-run UC-11 contract/integration smoke tests and capture evidence.
