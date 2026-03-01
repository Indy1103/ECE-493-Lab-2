# Data Model: Change Account Password (UC-04)

## Entity: AccountCredential

Purpose: Current credential state for one registered account.

Fields:
- account_id (UUID, PK, FK -> Account.id)
- password_hash (string, Argon2 hash, non-null)
- password_algo (enum: ARGON2ID, non-null)
- credential_version (int, non-null, increments on each successful change)
- updated_at (timestamp, non-null)

Validation rules:
- `password_hash` must be generated only from approved hashing algorithm.
- `credential_version` must increment exactly by 1 on success.

State transitions:
- Active(vN) -> Active(vN+1) on successful validated change.
- Active(vN) -> Active(vN) on validation or operational failure.

## Entity: PasswordHistoryEntry

Purpose: Retain prior credential hashes to prevent reuse.

Fields:
- id (UUID, PK)
- account_id (UUID, FK -> Account.id, indexed)
- password_hash (string, non-null)
- created_at (timestamp, non-null)

Validation rules:
- New password hash must not match any of the latest 5 entries for the account.

Relationships:
- AccountCredential 1 -> many PasswordHistoryEntry.

Lifecycle:
- On successful password change, prior current hash is inserted into history.
- Retain only most recent 5 entries per account (older entries pruned).

## Entity: PasswordChangeAttempt

Purpose: Record each user submission attempt and outcome.

Fields:
- id (UUID, PK)
- account_id (UUID, FK -> Account.id)
- session_id (UUID/string, nullable)
- source_ip (string, non-null)
- outcome (enum: SUCCESS, VALIDATION_FAILED, THROTTLED, OPERATIONAL_FAILED)
- reason_code (string, non-null)
- occurred_at (timestamp, non-null)
- request_id (string, non-null)

Validation rules:
- Credential material must never be stored in this entity.

Relationships:
- Account 1 -> many PasswordChangeAttempt.

## Entity: SessionRecord

Purpose: Represent authenticated sessions for revocation after successful password update.

Fields:
- session_id (UUID/string, PK)
- account_id (UUID, FK -> Account.id, indexed)
- status (enum: ACTIVE, REVOKED, EXPIRED)
- revoked_at (timestamp, nullable)
- revoke_reason (enum: PASSWORD_CHANGED, nullable)

State transitions:
- ACTIVE -> REVOKED for all account sessions on successful password change.

## Invariants

- Password change requires valid authenticated session and current password verification.
- Password update and session revocation are atomic from user-observable perspective.
- Failed validation never changes AccountCredential.
- Concurrent requests for same account resolve deterministically using transactional lock/versioning.
