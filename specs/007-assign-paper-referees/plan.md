# Implementation Plan: Assign Referees to Submitted Papers

**Branch**: `007-assign-paper-referees` | **Date**: 2026-02-10 | **Spec**: `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/spec.md`
**Input**: Feature specification from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/spec.md`

## Summary

Implement UC-07 so authenticated editors can atomically assign eligible referees to submitted papers under conference policy limits, with serialized per-paper concurrency, explicit rejection reasons, and non-rollback invitation failure handling.

## Technical Context

**Language/Version**: TypeScript 5.x (React frontend + Fastify backend)  
**Primary Dependencies**: React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client, rate-limiter-flexible (existing auth-related throttling stack)  
**Storage**: PostgreSQL system of record for assignments/invitations + encrypted-at-rest controls + encrypted backups  
**Testing**: Unit, integration, contract, and acceptance tests mapped to AT-UC07-01/02/03; browser checks for Chrome + Firefox on assignment flows  
**Target Platform**: Browser-based web app + TypeScript web API services  
**Project Type**: Web (three-layer architecture: presentation/business/data)  
**Performance Goals**: p95 assignment response <= 700 ms for valid assignment requests up to configured referee batch size under nominal load  
**Constraints**: TDD-first, library-first, OOP domain boundaries, strict editor RBAC, atomic request semantics, serialized per-paper processing, explicit validation/authorization errors, no sensitive referee data in logs, invitation failures are retryable and must not roll back committed assignments  
**Scale/Scope**: Editorial assignment operations for active conference cycles; low-to-moderate concurrency with contention concentrated on the same paper  
**Clarifications Resolved in Phase 0**:
- Per-paper serialization uses row-level pessimistic locking in a DB transaction (see `research.md`, Decision 1).
- Invitation failure handling uses persisted invitation intents with asynchronous retry statuses (see `research.md`, Decision 2).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Test-first strategy is defined: failing tests are required before implementation tasks.
- [x] Acceptance traceability is defined: stories map to UC-07 and AT-UC07-01/02/03.
- [x] Layer compliance is explicit: presentation, business, and data responsibilities are identified.
- [x] Library-first decisions are documented; no custom cryptography, locking primitive, or transport stack is required.
- [x] Security controls cover TLS in transit, encryption at rest, and no plaintext credentials/paper/referee-sensitive data in logs.
- [x] RBAC impact is defined, including editor-only assignment permission and explicit authorization failures.
- [x] Validation rules and explicit user-visible error responses are defined.
- [x] Reliability coverage includes concurrency serialization, invitation failure handling, and backup/restore impact.
- [x] Public information access without authentication remains unaffected by this protected feature.
- [x] Auditability requirements are documented for assignment and invitation outcomes.

## Project Structure

### Documentation (this feature)

```text
/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/
├── backend/
│   ├── src/
│   │   ├── presentation/
│   │   ├── business/
│   │   ├── data/
│   │   ├── security/
│   │   └── shared/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── contract/
├── frontend/
│   └── src/
└── infra/
    ├── db/
    └── ops/
```

**Structure Decision**: Keep request parsing/response shaping in presentation, assignment policy and atomicity/concurrency orchestration in business, and transactional persistence/locking in data so constitutional layer boundaries remain explicit.

## Phase 0: Outline & Research

Research tasks dispatched from technical context unknowns, dependencies, and integrations:
- Research per-paper serialization primitive in PostgreSQL-backed APIs (resolved in `research.md` Decision 1).
- Research invitation failure retry integration path after committed assignment (resolved in `research.md` Decision 2).
- Find best practices for atomic multi-referee assignment validation with all-or-nothing persistence.
- Find best practices for editor RBAC enforcement and explicit authorization feedback on assignment endpoints.
- Find best practices for structured audit-event schema for assignment and invitation outcomes without sensitive data leakage.

Phase 0 output: `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/research.md` with decisions, rationale, and alternatives.

## Phase 1: Design & Contracts

Design outputs generated from spec and research:
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/data-model.md`
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/contracts/referee-assignments.openapi.yaml`
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/007-assign-paper-referees/quickstart.md`

Agent context update command:
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/.specify/scripts/bash/update-agent-context.sh codex`

## Post-Design Constitution Re-Check

- [x] Design preserves three-layer architecture boundaries across assignment and invitation workflows.
- [x] Contracts enforce authenticated editor access and explicit authorization/validation/capacity/workload errors.
- [x] Security posture includes encrypted transport assumptions, encrypted assignment/invitation persistence, and no sensitive plaintext logging.
- [x] Reliability safeguards include per-paper serialization and explicit retryable invitation failure handling without rollback.
- [x] Backup/restore impact and auditability are represented in model and contract behavior.
- [x] Traceability remains explicit to UC-07 and AT-UC07-01/02/03.

## Phase 2 Planning Stop

Planning is complete through Phase 1 design outputs. Task decomposition is intentionally deferred to `/speckit.tasks`.

## Complexity Tracking

No constitution violations identified; no waiver required.
