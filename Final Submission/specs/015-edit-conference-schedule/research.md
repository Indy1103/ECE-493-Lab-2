# Research — Edit Conference Schedule

## Decision 1: Edit scope
- **Decision**: Allow editors to modify existing schedule arrangements and finalize the schedule.
- **Rationale**: Matches UC-15 and avoids expanding behavior beyond schedule editing.
- **Alternatives considered**: Allow non-editor roles to edit; rejected due to RBAC constraints.

## Decision 2: Validation behavior
- **Decision**: Validate all requested modifications before applying; invalid changes are rejected with explicit errors.
- **Rationale**: UC-15 extension 3a and Constitution validation rules.
- **Alternatives considered**: Partial acceptance; rejected to avoid inconsistent schedule state.

## Decision 3: Concurrency handling
- **Decision**: Reject invalid or conflicting edits at validation time and leave schedule unchanged.
- **Rationale**: Reliability requirement to prevent corrupted state.
- **Alternatives considered**: Silent overwrite; rejected due to auditability and reliability constraints.
