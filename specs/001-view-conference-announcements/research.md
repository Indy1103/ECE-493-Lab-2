# Research: Public Conference Announcement Access

## Decision 1: API style for public announcement retrieval
- Decision: Use a REST endpoint `GET /api/public/announcements` with deterministic 200/503 behavior.
- Rationale: UC-01 is a simple read workflow; REST keeps contract surface small and testable while mapping directly to available/empty/failure outcomes.
- Alternatives considered: GraphQL query endpoint (rejected as unnecessary complexity for single public read flow); server-rendered HTML-only transport contract (rejected because it weakens API-level contract testing).

## Decision 2: Backend web framework
- Decision: Use Fastify for the TypeScript backend HTTP layer.
- Rationale: Strong performance profile, schema-friendly request/response handling, and straightforward composition with structured logging.
- Alternatives considered: Express (rejected due to weaker built-in schema ergonomics); NestJS (rejected as heavier framework overhead for this focused feature).

## Decision 3: Data access and query safety
- Decision: Use Prisma for PostgreSQL access with explicit filter predicates for public visibility windows.
- Rationale: Typed query construction supports maintainable filter logic and reduces mistakes in time-window and visibility constraints.
- Alternatives considered: Raw SQL only (rejected due to maintainability/consistency risk); TypeORM/Sequelize (rejected in favor of stronger current TypeScript ergonomics).

## Decision 4: Validation and error-shape consistency
- Decision: Use Zod schemas at service boundaries for response-state and error payload consistency.
- Rationale: Enforces explicit, testable output contracts and supports constitution-required explicit error communication.
- Alternatives considered: Manual validation (rejected due to drift risk); JSON Schema-only without runtime typing (rejected for lower developer ergonomics).

## Decision 5: Observability and operational readiness
- Decision: Emit structured logs via Pino, publish a retrieval-failure-rate metric, and alert at `>5%` failures for `5` consecutive minutes.
- Rationale: Matches spec requirements and provides actionable operations signals without over-instrumentation.
- Alternatives considered: Logs-only (rejected due to weak proactive detection); metrics-only (rejected due to weaker root-cause traceability).

## Decision 6: Performance and load baseline interpretation
- Decision: Define normal operating load as 100 concurrent anonymous users and enforce `p95 <= 2s` for announcement retrieval/rendering.
- Rationale: Provides a measurable target for contract/performance tests and aligns with clarified specification constraints.
- Alternatives considered: No explicit load baseline (rejected due to ambiguous acceptance); stricter 1s target (rejected as higher risk without profiling data).

## Decision 7: Security posture for public endpoint
- Decision: Keep endpoint unauthenticated while enforcing strict filtering against non-public announcements and TLS-only transport.
- Rationale: Preserves UC-01 public-access intent while satisfying constitution requirements for confidentiality and explicit boundaries.
- Alternatives considered: Require login (rejected because it violates UC-01); expose all announcements then hide in UI (rejected due to data leakage risk).
