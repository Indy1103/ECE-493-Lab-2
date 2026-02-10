# Research — Generate Conference Schedule

## Decision 1: Draft schedule structure
- **Decision**: Generate a draft schedule listing accepted papers ordered by submission time, without session/time assignments.
- **Rationale**: Matches clarified scope and avoids premature session allocation before later scheduling steps.
- **Alternatives considered**: Auto-assign sessions/time slots during generation; rejected because it exceeds UC-14 scope.

## Decision 2: Authorization scope
- **Decision**: Restrict schedule generation and viewing to administrators only.
- **Rationale**: Constitution mandates least-privilege RBAC for scheduling actions.
- **Alternatives considered**: Allow editors or public access; rejected due to RBAC constraints.

## Decision 3: Error handling for no accepted papers
- **Decision**: Validate accepted-paper existence before generation and return explicit, user-visible error with no schedule created.
- **Rationale**: Required by UC-14 extension 2a and Constitution validation rules.
- **Alternatives considered**: Generate empty schedule; rejected because UC-14 requires failure end condition.

## Decision 4: Concurrency handling
- **Decision**: Treat schedule generation as idempotent per conference; concurrent requests return the latest draft or serialized generation.
- **Rationale**: Reliability requirement to avoid inconsistent output.
- **Alternatives considered**: Allow parallel draft variants; rejected due to inconsistency risk.
