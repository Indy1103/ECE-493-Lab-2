# Research: Record Final Decision (UC-12)

## Decision 1: Final decision immutability
- Decision: Final decision is immutable once recorded; subsequent attempts are rejected with an explicit user-visible message.
- Rationale: Prevents conflicting outcomes, simplifies auditability, and aligns with governance expectations for editorial decisions.
- Alternatives considered: Allow edits; allow edits only via admin reopen workflow.

## Decision 2: Review completion gating
- Decision: Block decision recording until all required reviews are completed; show “decision not allowed yet” without review content.
- Rationale: Prevents premature decisions and avoids partial disclosure when preconditions are not met.
- Alternatives considered: Allow decision with warning; show review content while blocking decision.

## Decision 3: Author notification handling
- Decision: Notify author on successful decision recording; if notification delivery fails, surface a visible failure message while preserving the decision record.
- Rationale: Ensures decision persistence is not lost, while preserving transparency for the editor.
- Alternatives considered: Roll back decision if notification fails; silently retry without user feedback.

## Decision 4: Concurrency safety
- Decision: Enforce single final decision per paper with idempotent recording and conflict handling on concurrent attempts.
- Rationale: Prevents duplicate or inconsistent outcomes under concurrent editor actions.
- Alternatives considered: Last-write-wins without conflict signaling.

## Decision 5: Auditability and outcomes
- Decision: Emit structured audit records for decision attempts (success, blocked, denied, session-expired) without sensitive payloads.
- Rationale: Required by constitution for security-relevant actions.
- Alternatives considered: Logging only success paths.
