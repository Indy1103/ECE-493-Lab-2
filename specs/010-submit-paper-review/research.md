# Research: Submit Paper Review (UC-10)

## Decision 1: Enforce exactly one final submission per referee-assignment
Rationale: Prevents conflicting duplicated final records and aligns with clarified requirement that repeated submission attempts must be rejected explicitly.
Alternatives considered:
- Allow overwrite of previous submission: introduces decision ambiguity for editorial review history.
- Allow multiple final submissions: increases conflict risk and complicates decision workflows.

## Decision 2: Revalidate assignment eligibility at submit time
Rationale: Eligibility can change after form load; submit-time check prevents stale authorization and invalid review recording.
Alternatives considered:
- Trust form-load snapshot: vulnerable to stale or revoked assignment conditions.
- Accept then flag for manual review: adds operational complexity and weakens deterministic outcomes.

## Decision 3: Use generic non-enumerating denial for non-owned/non-assigned submissions
Rationale: Reduces resource-enumeration risk while preserving explicit user-visible outcomes required by policy.
Alternatives considered:
- Explicit unauthorized response: clearer but may disclose assignment existence.
- Silent redirect: violates explicit error communication expectations.

## Decision 4: Validation failures must be field-specific and correction-oriented
Rationale: UC-10 extension 4a requires users to correct and resubmit; actionable validation feedback is necessary for successful correction loops.
Alternatives considered:
- Generic invalid-submission message: insufficient for efficient correction.
- Automatic correction without user confirmation: violates explicit validation policy.

## Decision 5: Audit both accepted and rejected submission outcomes with sanitized payloads
Rationale: Security-relevant and decision-impacting workflows require traceable outcomes while protecting sensitive content.
Alternatives considered:
- Audit only success: incomplete accountability for rejected/unauthorized attempts.
- Audit full payloads: conflicts with sensitive data handling requirements.
