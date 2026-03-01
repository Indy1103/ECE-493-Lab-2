# Research: Author Receive Decision (UC-13)

## Decision 1: Notification failure visibility
- Decision: Show a banner in the author portal when decision notification delivery fails, prompting the author to check decision status.
- Rationale: Keeps UX deterministic and aligns with explicit user-visible error requirements.
- Alternatives considered: Silent failure; follow-up notification after delivery resumes.

## Decision 2: Decision content scope
- Decision: Present only the acceptance or rejection outcome, no additional decision metadata.
- Rationale: Minimizes disclosure while satisfying the use case.
- Alternatives considered: Include editor comments or timestamps.

## Decision 3: Access control
- Decision: Require authenticated author access with ownership verification; otherwise return a generic unavailable response.
- Rationale: Aligns with confidentiality and least-privilege requirements.
- Alternatives considered: Public access via tokenized link.

## Decision 4: Concurrency handling
- Decision: Allow concurrent decision access without inconsistent views; data reads are idempotent.
- Rationale: Read-only access should remain consistent under parallel access.
- Alternatives considered: Access throttling or caching per author session.

## Decision 5: Auditability and outcomes
- Decision: Emit structured audit records for decision access and notification failure events without sensitive payloads.
- Rationale: Required by constitution for security-relevant actions.
- Alternatives considered: Log only success paths.
