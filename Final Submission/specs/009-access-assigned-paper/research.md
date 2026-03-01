# Research: Access Assigned Paper for Review (UC-09)

## Decision 1: Use generic unavailable/not-found response for direct access to non-owned assignments
Rationale: Prevents assignment/resource enumeration while still giving explicit user-visible failure outcome consistent with least-privilege RBAC and confidentiality requirements.
Alternatives considered:
- Explicit "not authorized" response: clearer but leaks existence of protected assignment/paper linkage.
- Silent redirect without message: weaker explicit-error communication.

## Decision 2: Revalidate assignment ownership and availability at paper-selection time
Rationale: Handles race conditions where assignment state changes between list retrieval and selection, ensuring consistent and secure final outcomes.
Alternatives considered:
- Trust list snapshot: risks stale or unauthorized access during concurrent updates.
- Deferred background revalidation: increases complexity and can produce contradictory UX.

## Decision 3: Enforce atomic access for paper and review form
Rationale: UC-09 success condition is access to both paper and associated review form; atomicity avoids partial access states that undermine reviewer workflow.
Alternatives considered:
- Partial paper-only access: creates inconsistent state and extra retry logic.
- Async review-form retry while paper opens: increases UX and error-handling complexity.

## Decision 4: Expired session returns unauthorized/session-expired outcome requiring re-authentication
Rationale: Standard protected-resource handling; prevents leaking assignment data and aligns with explicit error communication.
Alternatives considered:
- Silent token refresh: not guaranteed by existing auth design and can mask auth boundary failures.
- Generic non-auth error: degrades diagnosability and UX.

## Decision 5: Contract-first endpoint design for list and access actions
Rationale: Separating list retrieval from selected-paper access keeps responsibilities clear across presentation/business/data layers and makes AT-UC09-01/02/03 traceable.
Alternatives considered:
- Single combined endpoint returning list + resource: complicates failure mapping and caching.
- GraphQL-only design: viable but unnecessary for current bounded UC scope.
