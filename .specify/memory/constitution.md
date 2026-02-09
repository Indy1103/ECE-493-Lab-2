<!--
Sync Impact Report
- Version change: 0.0.0 (template baseline) -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Test-Driven and Acceptance-Traceable Delivery (NON-NEGOTIABLE)
  - Template Principle 2 -> II. Library-First, Simplicity-First Engineering
  - Template Principle 3 -> III. Three-Layer Web Architecture with OOP Boundaries
  - Template Principle 4 -> IV. Security and Confidentiality by Default
  - Template Principle 5 -> V. Least-Privilege RBAC for All Protected Actions
  - Added Principle -> VI. Strict Validation and Explicit Error Communication
  - Added Principle -> VII. Reliability, Availability, and Recoverability
- Added sections:
  - Technology, Platform, and Data Protection Standards
  - Delivery Workflow and Quality Gates
- Removed sections:
  - None (template placeholders/comments replaced with concrete governance)
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
  - ⚠ pending: README.md (not present in repository)
  - ⚠ pending: docs/quickstart.md (not present in repository)
- Follow-up TODOs:
  - Create `.specify/templates/commands/` command documents so constitution checks can be synchronized there.
-->
# Conference Management System (CMS) Constitution

## Core Principles

### I. Test-Driven and Acceptance-Traceable Delivery (NON-NEGOTIABLE)
- Every behavior change MUST start with failing tests before production code is written.
- Every feature and bug fix MUST trace to one or more use cases in `UseCases.md` and
  acceptance tests in `TestSuite.md`.
- A change MUST NOT be merged unless all affected unit, integration, and acceptance tests
  pass in CI.

Rationale: Test-first delivery and explicit traceability are required for auditability, safe
change, and predictable releases.

### II. Library-First, Simplicity-First Engineering
- Teams MUST use established, well-maintained libraries before building custom
  infrastructure.
- Custom implementations for solved problems MUST include written justification of why
  existing libraries are insufficient.
- Designs MUST favor clarity and straightforward composition over clever abstractions.

Rationale: Reusing proven libraries and simple designs lowers defect rates and long-term
maintenance cost.

### III. Three-Layer Web Architecture with OOP Boundaries
- The system MUST be a browser-based web application implemented with React and
  TypeScript, with PostgreSQL as the system of record.
- The codebase MUST enforce three distinct layers: presentation, business logic, and data.
- Presentation code MUST NOT directly access persistence concerns; all data access MUST
  pass through business logic and data layers.
- Core business workflows and domain models MUST use object-oriented design principles.
- Supported browsers MUST include current Chrome and Firefox releases at minimum.

Rationale: Layered boundaries and OOP improve testability, maintainability, and controlled
change.

### IV. Security and Confidentiality by Default
- All data in transit MUST be encrypted (TLS-enabled endpoints only).
- Sensitive data at rest MUST be encrypted, including stored credentials, paper files, and
  backups.
- User credentials and paper files MUST NEVER be stored, logged, or transmitted in
  plaintext.
- Data integrity and confidentiality requirements MUST take precedence over performance
  optimizations.

Rationale: The CMS processes sensitive identity and manuscript data that requires strong,
defensive security controls.

### V. Least-Privilege RBAC for All Protected Actions
- Access control MUST be enforced through explicit roles and permissions.
- Privileged actions, including referee assignment, editorial decisions, and conference
  scheduling, MUST be restricted to authorized roles.
- No role may read or modify data outside its documented responsibilities.
- Authorization failures MUST be explicit, user-visible when applicable, and auditable.

Rationale: Least-privilege RBAC constrains blast radius and enforces accountable governance.

### VI. Strict Validation and Explicit Error Communication
- All user input MUST be validated before persistence or state transition.
- Invalid input MUST produce explicit, user-visible error messages that identify the violated
  rule.
- The system MUST NEVER silently fail and MUST NEVER auto-correct invalid data without
  explicit user confirmation.

Rationale: Explicit validation protects data quality, fairness, and user trust.

### VII. Reliability, Availability, and Recoverability
- The system MUST safely support concurrent requests without data corruption or lost
  updates.
- The system MUST be engineered for continuous availability (24/7 operation target).
- Backup and recovery mechanisms MUST be implemented, tested, and documented.
- Reliability requirements MUST take priority over experimental features.
- Public conference information MUST remain accessible without authentication.
- User interfaces MUST be responsive and clearly communicate operational errors and
  policy violations.

Rationale: Conference operations are time-sensitive and require dependable, transparent
service behavior.

## Technology, Platform, and Data Protection Standards

- Frontend MUST use React + TypeScript and responsive layouts for desktop and mobile form
  factors.
- Backend MUST expose web APIs in TypeScript and enforce role-aware authorization at
  service boundaries.
- PostgreSQL MUST be the authoritative datastore with controlled migrations and transaction
  integrity.
- Password handling MUST use vetted hashing libraries (for example, Argon2 or bcrypt);
  plaintext credential storage is prohibited.
- Paper file handling MUST use encrypted storage and transport, and file access events MUST
  be auditable.
- Dependency choices MUST prioritize maintained, widely adopted libraries with active
  security patch cadence.
- Backup scheduling, retention, restore procedures, and RPO/RTO targets MUST be documented
  and verified regularly.

## Delivery Workflow and Quality Gates

1. Specification gates: Each feature spec MUST reference relevant use case IDs (`UC-XX`) and
   acceptance test IDs (`AT-UCXX-YY`) before implementation begins.
2. Planning gates: Each implementation plan MUST document layer boundaries, library choices,
   RBAC impact, validation strategy, encryption impact, and backup/recovery impact.
3. Implementation gates: Developers MUST follow Red-Green-Refactor. Tests fail first,
   implementation second, refactor third.
4. Review gates: Pull requests MUST include evidence for architecture compliance, explicit
   validation errors, no-plaintext handling, and role-based authorization checks.
5. Release gates: Releases MUST run full automated test suites, browser checks for Chrome and
   Firefox, and backup/restore verification for data-impacting changes.
6. Audit gates: Security-relevant actions (auth, assignments, decisions, scheduling,
   submissions, payments) MUST emit structured audit logs without exposing sensitive payloads.

## Governance

- This constitution is the authoritative engineering policy for this repository and supersedes
  conflicting local conventions.
- Amendments MUST be proposed in a pull request that includes rationale, impacted sections,
  migration steps, and a semantic version bump classification.
- Versioning policy:
  - MAJOR: Backward-incompatible governance changes or principle removals/redefinitions.
  - MINOR: New principles/sections or materially expanded mandatory guidance.
  - PATCH: Clarifications, wording improvements, typo fixes, or non-semantic refinements.
- Compliance review expectations:
  - Every plan, spec, tasks file, and pull request MUST include a constitution compliance check.
  - Non-compliant changes MUST NOT be merged without a documented, time-bound waiver.
  - Approved waivers MUST include owner, scope, expiration date, and mitigation plan.

**Version**: 1.0.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09
