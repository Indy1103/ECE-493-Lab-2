# Incident Response Runbook

## Scope

Operational handling for assignment/invitation workflows from UC-07 and invitation response decision flows introduced by UC-08.

## Trigger Conditions

- Repeated `INVITATION_DELIVERY_FAILED` retryable failures for `review_invitations`.
- `RETRY_BUDGET_EXHAUSTED` terminal invitation state observed.
- Elevated `ASSIGNMENT_CONFLICT` responses indicating assignment contention spikes.
- Elevated `INVITATION_ALREADY_RESOLVED` conflicts indicating concurrent response contention.
- Repeated `RESPONSE_RECORDING_FAILED` outcomes while invitation remains pending.

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

## UC-08 Invitation Response Steps

1. Confirm affected invitation rows in `review_invitations` and inspect `response_status`/`response_recorded_at`.
2. For `RESPONSE_RECORDING_FAILED`, verify invitation remains unresolved (`response_status = PENDING`) and no `referee_assignments.source_invitation_id` side effect was committed.
3. For `INVITATION_ALREADY_RESOLVED`, identify winning response attempt in `invitation_response_attempts` and confirm later attempt was rejected.
4. If repeated recording failures occur, escalate storage/transaction subsystem and keep invitation open for referee retry once service is stable.
5. Confirm audit trail and response-attempt records contain request IDs and reason codes without sensitive reviewer text.

## Post-Incident Evidence

- Incident ID and start/end timestamps.
- Count of invitations retried and terminally failed.
- Root cause classification (provider outage, transport issue, payload issue, etc.).
- Verified data-integrity checks for assignments and invitations after recovery.
- Count of invitation responses rejected as conflicts vs successfully recorded.
- Verified unresolved-state preservation checks for all recording-failure incidents.
