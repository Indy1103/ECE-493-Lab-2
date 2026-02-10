# Research Notes: View Registration Prices

## Decision 1: Public Price List Retrieval Pattern

**Decision**: Expose a read-only public endpoint for the active published registration price list.
**Rationale**: Constitution requires public conference information to remain accessible without authentication; UC-17 is read-only and non-privileged.
**Alternatives considered**: Authenticated-only access (rejected due to Constitution public access requirement).

## Decision 2: RBAC Handling for Public Endpoints

**Decision**: Allow anonymous access for published price list retrieval; enforce RBAC for any administrative price list management outside this feature.
**Rationale**: UC-17 specifies attendee viewing only; public access aligns with least-privilege while preserving public information access.
**Alternatives considered**: Require attendee role for viewing (rejected as unnecessary restriction).

## Decision 3: Concurrency Expectations

**Decision**: Treat price list reads as high-concurrency, low-write operations; ensure queries are read-optimized and transactional writes maintain published list integrity.
**Rationale**: Registration periods create traffic spikes; read availability must remain reliable under load.
**Alternatives considered**: Cache-only storage (rejected due to integrity and freshness concerns).
