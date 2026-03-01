# Research — Author Schedule Access

## Decision 1: Notification delivery approach
- **Decision**: Use existing CMS notification delivery mechanisms for author schedule availability notices, with in-app notification records and delivery attempts managed by the shared notification service.
- **Rationale**: Reuses established infrastructure and maintains auditability without custom delivery logic.
- **Alternatives considered**: Custom delivery pipeline; rejected to avoid duplication and operational risk.

## Decision 2: Schedule availability check
- **Decision**: Gate schedule access on a published status flag before returning schedule content.
- **Rationale**: Matches UC-16 alternate flow requirements and avoids premature disclosure.
- **Alternatives considered**: Return partial schedules; rejected due to unclear user expectations and inconsistent state.

## Decision 3: Authorization scope
- **Decision**: Require authenticated author role to access schedule visibility endpoints.
- **Rationale**: Aligns with UC-16 preconditions and constitution RBAC requirements.
- **Alternatives considered**: Public access; rejected due to role-scoped visibility requirements.
