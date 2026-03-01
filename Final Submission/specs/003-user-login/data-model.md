# Data Model: User Login Authentication

## Entity: LoginAttempt

Purpose: Captures each authentication request and deterministic outcome.

Fields:
- `attempt_id` (UUID, required, immutable)
- `username_submitted` (string, required)
- `attempted_at` (timestamp with timezone, required)
- `client_key` (string, required; derived client identity key)
- `outcome` (enum, required: `AUTHENTICATED`, `INVALID_CREDENTIALS`, `THROTTLED`, `PROCESSING_FAILURE`)
- `request_id` (string, required)

Validation rules:
- Username and password inputs must be present before credential verification.
- Outcome must be exactly one enum value per attempt.
- Credential plaintext must never be persisted in this entity.

State transitions:
- `RECEIVED` -> `INVALID_CREDENTIALS`
- `RECEIVED` -> `THROTTLED`
- `RECEIVED` -> `AUTHENTICATED`
- `RECEIVED` -> `PROCESSING_FAILURE`

## Entity: AuthenticatedSession

Purpose: Represents authenticated access granted after successful credential verification.

Fields:
- `session_id` (UUID, required, immutable)
- `user_id` (UUID, required)
- `role` (enum/string, required)
- `issued_at` (timestamp with timezone, required)
- `expires_at` (timestamp with timezone, required)
- `last_activity_at` (timestamp with timezone, required)
- `request_id` (string, required)
- `status` (enum, required: `ACTIVE`, `EXPIRED`, `REVOKED`)

Validation rules:
- Session is created only when credentials are valid.
- Session role must match the authenticated user’s assigned role.
- Session lifetime must be explicitly bounded (`expires_at > issued_at`).

State transitions:
- `ACTIVE` -> `EXPIRED` (normal timeout)
- `ACTIVE` -> `REVOKED` (administrative/security revocation)

## Entity: RoleHomeMapping

Purpose: Authoritative mapping from role to role-specific home page destination.

Fields:
- `role` (enum/string, required, unique)
- `home_route` (string, required)
- `is_active` (boolean, required)
- `updated_at` (timestamp with timezone, required)

Validation rules:
- Each role maps to exactly one active home route.
- Unknown or inactive mappings must deny access and emit explicit failure guidance.

## Entity: LoginThrottleRecord

Purpose: Tracks failed login windows for client-based throttle enforcement.

Fields:
- `client_key` (string, required)
- `window_start` (timestamp with timezone, required)
- `failed_attempt_count` (integer, required)
- `blocked_until` (timestamp with timezone, nullable)

Validation rules:
- If `failed_attempt_count >= 5` within 10 minutes, set `blocked_until` to 10 minutes from threshold breach.
- While current time is earlier than `blocked_until`, login attempts from the same client must return `THROTTLED`.

## Relationships

- One `LoginAttempt` may create one `AuthenticatedSession` only when outcome is `AUTHENTICATED`.
- One `AuthenticatedSession` references one user identity and one `RoleHomeMapping` entry for routing.
- One `LoginThrottleRecord` governs many `LoginAttempt` entries sharing the same `client_key`.
