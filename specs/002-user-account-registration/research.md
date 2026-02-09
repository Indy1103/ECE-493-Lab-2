# Research: User Account Registration

## Decision 1: Registration API style and outcome semantics
- Decision: Use a REST endpoint `POST /api/public/registrations` with deterministic outcomes mapped to `201`, `400`, `409`, `429`, and `503`.
- Rationale: UC-02 scenarios map directly to these response classes (success, invalid input, duplicate email, throttling, operational failure) and support acceptance traceability.
- Alternatives considered: GraphQL mutation endpoint (rejected as unnecessary complexity for a single write workflow); HTML-only form post contract (rejected due to weaker contract-test surface).

## Decision 2: Password handling strategy
- Decision: Hash passwords using Argon2id with library-managed salt and never persist plaintext credentials.
- Rationale: Satisfies constitution security controls for credential confidentiality with a vetted, modern password hashing approach.
- Alternatives considered: bcrypt (acceptable alternative but not selected due to weaker memory-hard defaults); custom hashing utility (rejected by library-first principle).

## Decision 3: Email uniqueness normalization
- Decision: Enforce uniqueness on normalized email (`trim` + lowercase) while preserving original email casing for display.
- Rationale: Aligns with clarified UC-02 behavior and prevents duplicate logical accounts from casing/whitespace variation.
- Alternatives considered: Case-sensitive uniqueness (rejected because it permits practical duplicates); lowercase-only without trimming (rejected because whitespace variants would bypass uniqueness).

## Decision 4: Throttling policy for failed submissions
- Decision: Apply throttling after 5 failed submissions from the same client within 10 minutes, blocking additional submissions for 10 minutes with explicit user messaging.
- Rationale: Matches clarified specification behavior and provides abuse resistance while maintaining clear user feedback.
- Alternatives considered: No throttling (rejected due to abuse risk); stricter 3-failure lockout (rejected due to higher false-positive user friction).

## Decision 5: Validation strategy and error shape
- Decision: Use Zod schemas for request validation and a field-level error payload containing violated rule details.
- Rationale: Supports constitution requirements for strict validation and explicit error communication with consistent contract semantics.
- Alternatives considered: Manual validation logic (rejected due to drift/maintenance risk); generic error-only payloads (rejected because they do not identify violated rules clearly).

## Decision 6: Observability and auditability baseline
- Decision: Emit structured logs for all registration outcomes with request IDs and publish registration outcome counters/ratios for monitoring.
- Rationale: Enables traceable diagnosis and compliance with auditability/reliability expectations without exposing sensitive credential payloads.
- Alternatives considered: Logs-only observability (rejected due to weaker trend detection); metrics-only observability (rejected due to weaker incident traceability).

## Decision 7: Performance baseline for registration workload
- Decision: Set registration performance target to `p95 <= 1.5s` under 50 concurrent registration attempts.
- Rationale: Provides a measurable planning target for an occasional write-heavy user flow while maintaining strict validation and hashing controls.
- Alternatives considered: No explicit performance target (rejected due to non-measurable acceptance); `p95 <= 1.0s` (rejected as overly aggressive before profiling).

## Decision 8: Backup/restore impact for account creation
- Decision: Treat user-account records as backup-protected data with restore verification included in release gates.
- Rationale: Account creation mutates authoritative identity data and must satisfy constitution recoverability expectations.
- Alternatives considered: Feature-level exclusion from backup verification (rejected due to constitution conflict); best-effort undocumented restore behavior (rejected as non-auditable).
