# Research: View Completed Paper Reviews (UC-11)

## Decision 1: Enforce full completion gating before any review content is shown
Rationale: Prevents premature editorial decisions and aligns with UC-11 extension 2a and clarified requirement that no review content is shown until all required reviews are complete.
Alternatives considered:
- Show partial reviews with warnings: risks bias and violates clarified behavior.
- Show progress-only without content: less clear than explicit pending denial and still implies access patterns.

## Decision 2: Use generic unavailable/denied outcome for non-editor access
Rationale: Reduces resource-enumeration risk while preserving explicit user-visible outcomes required by policy.
Alternatives considered:
- Explicit unauthorized response: may disclose existence of papers/reviews.
- Silent failure/redirect: violates explicit error communication requirement.

## Decision 3: Anonymize referee identities in editor review display
Rationale: Protects reviewer confidentiality and reduces bias while still enabling editorial decisions.
Alternatives considered:
- Show identities to all editors: increases confidentiality risk.
- Reveal identities only for senior editors: adds role complexity not required by UC-11.

## Decision 4: Audit review-visibility requests and outcomes
Rationale: Security-relevant editorial access should be auditable without exposing review content in logs.
Alternatives considered:
- Audit only successes: reduces accountability for denied/pending access attempts.
- Log full payloads: violates confidentiality constraints.
