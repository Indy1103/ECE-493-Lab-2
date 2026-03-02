# Incident Response Runbook

## Scope

Operational handling for assignment and invitation workflows introduced by UC-07.

## Trigger Conditions

- Repeated `INVITATION_DELIVERY_FAILED` retryable failures for `review_invitations`.
- `RETRY_BUDGET_EXHAUSTED` terminal invitation state observed.
- Elevated `ASSIGNMENT_CONFLICT` responses indicating assignment contention spikes.

## Retry Policy

- Retry owner: backend operations on-call.
- Retry mechanism: process `FAILED_RETRYABLE` invitations via `InvitationDispatchService.retryFailedInvitations()`.
- Backoff policy: exponential (`baseBackoffMs * 2^(attempt-1)`).
- Maximum retry attempts: 3 for default runtime policy (configurable per deployment).
- Terminal state: set invitation `invitation_status = FAILED_FINAL` with `failure_reason_code = RETRY_BUDGET_EXHAUSTED`.

## Response Steps

1. Confirm assignment records are committed (`referee_assignments`) and unchanged.
2. Query outstanding `review_invitations` where status is `FAILED_RETRYABLE`.
3. Execute retry worker/pipeline and monitor transition to `SENT` or `FAILED_FINAL`.
4. If terminal failures remain, open manual follow-up task to contact referee and capture remediation action.
5. Confirm audit trail (`assignment_attempt_audits`) contains success/failure reason codes for impacted requests.

## Post-Incident Evidence

- Incident ID and start/end timestamps.
- Count of invitations retried and terminally failed.
- Root cause classification (provider outage, transport issue, payload issue, etc.).
- Verified data-integrity checks for assignments and invitations after recovery.
