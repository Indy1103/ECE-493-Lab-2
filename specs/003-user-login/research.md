# Research: User Login Authentication

## Decision 1: Login API shape and outcomes
- Decision: Use a public REST endpoint `POST /api/public/login` with deterministic outcomes `200`, `401`, `429`, and `503`.
- Rationale: Aligns directly with UC-03 success and invalid-credential flows while preserving explicit outcomes for throttling and operational failure.
- Alternatives considered: GraphQL mutation (rejected as unnecessary complexity for a single authentication workflow); form-post-only behavior without explicit API contract (rejected due to weaker contract-test traceability).

## Decision 2: Credential verification strategy
- Decision: Verify submitted password against stored password hash using Argon2id and never handle plaintext beyond immediate verification boundaries.
- Rationale: Meets constitutional no-plaintext and vetted-library security obligations.
- Alternatives considered: bcrypt (acceptable but not selected due to weaker memory-hard defaults); custom hash implementation (rejected by library-first principle).

## Decision 3: Failed-login throttling policy
- Decision: Apply client-based throttling after 5 failed login attempts within 10 minutes, enforcing a 10-minute cooldown.
- Rationale: Matches clarified feature behavior and provides abuse resistance with manageable user impact.
- Alternatives considered: No throttling (rejected due to credential-stuffing risk); permanent account lockout (rejected due to denial-of-service risk on legitimate users).

## Decision 4: Invalid credential messaging posture
- Decision: Return explicit but non-sensitive invalid-credential messaging and avoid differentiating whether username or password caused failure.
- Rationale: Satisfies explicit error communication while reducing account enumeration exposure.
- Alternatives considered: Silent failures (rejected by constitution); detailed username-vs-password errors (rejected due to information leakage risk).

## Decision 5: Role-specific home page routing
- Decision: Resolve destination through authoritative role-home mapping in business logic after successful authentication.
- Rationale: Preserves layer boundaries and ensures least-privilege access behavior is centrally controlled.
- Alternatives considered: Hard-coded routing in presentation layer (rejected due to boundary violations and maintainability risk).

## Decision 6: Session and auditability baseline
- Decision: Establish authenticated session records with request IDs; emit structured login outcome logs and outcome metrics.
- Rationale: Supports constitutional auditability and operational diagnosability without exposing credentials.
- Alternatives considered: Metrics-only observability (rejected due to weak traceability); logs-only observability (rejected due to weak trend/alert coverage).

## Decision 7: Reliability and recovery impact
- Decision: Treat authentication/session records as backup-protected data and include restore verification in release gates.
- Rationale: Satisfies constitutional recoverability requirements for login-critical data.
- Alternatives considered: Best-effort restore without verification (rejected as non-auditable and policy-incompatible).

## Decision 8: Performance target for frequent login flow
- Decision: Set login performance target to `p95 <= 1.0s` at 100 concurrent login attempts.
- Rationale: Supports frequent-use expectations while maintaining security checks and deterministic behavior.
- Alternatives considered: No explicit target (rejected due to non-measurable acceptance); stricter `p95 <= 0.5s` target (rejected as premature without profiling data).
