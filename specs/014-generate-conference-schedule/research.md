# Research: Generate Conference Schedule (UC-14)

## Decisions

1. Use explicit outcomes for API responses
- DECISION: Response outcomes include `SCHEDULE_GENERATED`, `NO_ACCEPTED_PAPERS`, `UNAVAILABLE_DENIED`, `SESSION_EXPIRED`, and `TLS_REQUIRED`.
- RATIONALE: Matches existing explicit outcome style across backend modules.

2. Deterministic schedule order
- DECISION: Sort accepted papers by `paperId` and assign sequential slots.
- RATIONALE: Stable output supports repeatable tests and predictable administrator review.

3. Concurrency handling
- DECISION: Apply per-conference lock in repository and return consistent generated payload for concurrent requests.
- RATIONALE: Satisfies RAR-001 with deterministic behavior.

4. Security posture
- DECISION: Enforce TLS pre-handler and admin session guard before generation.
- RATIONALE: Satisfies SPR-001 and SPR-004.
