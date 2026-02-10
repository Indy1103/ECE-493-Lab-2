# Phase 0 Research: Change Account Password (UC-04)

## Decision 1: Failed-attempt throttling policy

- Decision: Apply temporary lockout using dual counters (per-account and per-IP) with a 15-minute lockout after 5 failed attempts in 15 minutes.
- Rationale: Dual-key throttling mitigates both targeted account guessing and distributed abuse while preserving usability for legitimate users.
- Alternatives considered:
  - Per-IP only throttling: rejected because distributed attacks bypass it.
  - Permanent account lock: rejected due to support burden and denial-of-service risk.

## Decision 2: Session handling after successful password change

- Decision: Revoke all active sessions for the account, including the initiating session, and require immediate re-authentication.
- Rationale: Full invalidation minimizes hijacked-session persistence and aligns with credential-rotation security intent.
- Alternatives considered:
  - Revoke only non-current sessions: rejected because current compromised sessions remain valid.
  - Keep all sessions until expiry: rejected as weak post-change security posture.

## Decision 3: Password history enforcement

- Decision: Reject reuse of any of the previous 5 password hashes for the account.
- Rationale: Prevents password cycling and gives concrete, testable policy depth with moderate storage overhead.
- Alternatives considered:
  - No history enforcement: rejected due to weak security.
  - Last 10 passwords: rejected as stricter than current feature scope and policy baseline.

## Decision 4: Credential update consistency under concurrency

- Decision: Execute password change in a single database transaction with row-level account credential lock and monotonic credential version update.
- Rationale: Prevents lost updates/corruption when multiple submissions hit the same account.
- Alternatives considered:
  - Last-write-wins without locking: rejected due to nondeterministic outcomes.
  - Distributed lock service: rejected as unnecessary complexity for single-record transaction.

## Decision 5: Audit logging schema for password-change attempts

- Decision: Emit structured audit events for every attempt with fields: event_type, account_id, source_ip, session_id (if present), outcome, reason_code, timestamp, request_id; never include password or derived plaintext.
- Rationale: Supports investigations and constitutional audit requirements while protecting credential secrecy.
- Alternatives considered:
  - Success-only logging: rejected because failed-attempt visibility is required for abuse detection.
  - Free-form text logs only: rejected due to weak queryability and traceability.
