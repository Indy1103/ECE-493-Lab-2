# Public Announcements Incident Runbook

## Trigger Conditions
- Alert `PublicAnnouncementsRetrievalFailureRateHigh` firing for 5 minutes.
- Availability probes report endpoint degradation.

## Immediate Actions
1. Check structured logs for `failureCategory=RETRIEVAL_FAILURE` and correlate by `requestId`.
2. Verify datastore reachability and query latency.
3. Validate TLS termination health for `/api/public/announcements`.

## Recovery Actions
1. Roll back recent data-access or route deployments if correlated with incident start.
2. Restore database connectivity and confirm query success.
3. Re-check endpoint responses for `AVAILABLE` or `EMPTY` outcomes.

## Exit Criteria
- Retrieval failure rate below 5% for 10 consecutive minutes.
- Synthetic probe success restored.
