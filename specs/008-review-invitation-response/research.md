# Phase 0 Research: Respond to Review Invitation (UC-08)

## Decision 1: Concurrent response conflict handling

- Decision: Enforce first-valid-response-wins semantics by locking the invitation decision row during response recording and rejecting later submissions once resolved.
- Rationale: Matches clarified behavior, prevents conflicting terminal states, and keeps acceptance tests deterministic.
- Alternatives considered:
  - Last-write-wins: rejected due to non-deterministic user-visible outcomes.
  - Accept both with reconciliation: rejected due to state ambiguity and policy complexity.

## Decision 2: Invitation detail disclosure scope

- Decision: Require minimum decision context in invitation view: paper title, abstract/summary, review due date, and response deadline.
- Rationale: Satisfies informed user decision needs while limiting unnecessary data exposure.
- Alternatives considered:
  - Title-only summary: rejected as insufficient for informed acceptance/rejection.
  - Full manuscript disclosure at invitation step: rejected as unnecessary scope expansion for UC-08.

## Decision 3: Failure-state side-effect control

- Decision: On response-recording failure, preserve invitation as pending and ensure no reviewer assignment mutation is committed from that failed attempt.
- Rationale: Aligns with failed end condition and reliability requirement that unresolved state remains retriable.
- Alternatives considered:
  - Partial commit with warning: rejected due to integrity inconsistency.
  - Terminal failure state without retry: rejected because it blocks legitimate retry flow.

## Decision 4: Authorization boundary

- Decision: Enforce authenticated invited-referee-only response rights at service boundary and return explicit authorization feedback for non-owner access.
- Rationale: Satisfies least-privilege and explicit-error constitutional principles.
- Alternatives considered:
  - Client-side invitation ownership filtering only: rejected because backend authorization is mandatory.
  - Generic forbidden without reason signal: rejected due to explicit user-visible failure requirement.

## Decision 5: Auditable response outcomes

- Decision: Emit structured audit events for accept, reject, conflict reject, auth reject, and recording failure outcomes with request and invitation identifiers, excluding sensitive reviewer content.
- Rationale: Meets reliability/auditability requirements without violating confidentiality constraints.
- Alternatives considered:
  - Success-only auditing: rejected due to incomplete failure-path observability.
  - Full payload logging: rejected due to privacy and logging constraints.
