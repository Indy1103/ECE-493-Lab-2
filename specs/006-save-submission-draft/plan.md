# Implementation Plan: Save Paper Submission Draft

**Branch**: `006-save-submission-draft` | **Date**: 2026-02-10 | **Spec**: `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/spec.md`
**Input**: Feature specification from `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/spec.md`

## Summary

Implement UC-06 draft-save capability so authenticated authors can persist partial submission state, receive explicit validation feedback on invalid draft saves, and resume later from one current draft per in-progress submission with deterministic concurrency behavior.

## Technical Context

**Language/Version**: TypeScript 5.x (React frontend + Fastify backend)  
**Primary Dependencies**: React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client  
**Storage**: PostgreSQL system of record for draft state and metadata + encrypted-at-rest controls + encrypted backups  
**Testing**: Unit, integration, contract, and acceptance tests mapped to AT-UC06-01/02; browser checks for Chrome + Firefox on draft save/resume flows  
**Target Platform**: Browser-based web app + TypeScript web API services  
**Project Type**: Web (three-layer architecture: presentation/business/data)  
**Performance Goals**: p95 draft-save response <= 500 ms for valid draft payloads under nominal load  
**Constraints**: TDD-first, library-first, OOP domain boundaries, strict author ownership checks, explicit validation/authorization errors, no plaintext draft content in logs, deterministic last-write-wins for concurrent valid saves, backup/restore compatibility  
**Scale/Scope**: Single author working set with occasional concurrent saves; one current draft per `(author, in-progress submission)`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Test-first strategy is defined: failing tests are required before implementation tasks.
- [x] Acceptance traceability is defined: stories map to UC-06 and AT-UC06-01/02.
- [x] Layer compliance is explicit: presentation, business, and data responsibilities are identified.
- [x] Library-first decisions are documented; no custom crypto/serialization primitives are required.
- [x] Security controls cover TLS in transit, encryption at rest, and no plaintext credential/paper/draft payload logging.
- [x] RBAC impact is defined, including author ownership enforcement and explicit authorization failures.
- [x] Validation rules and explicit user-visible error responses are defined.
- [x] Reliability coverage includes deterministic concurrency behavior, operational-failure handling, and backup/restore impact.
- [x] Public information access without authentication remains unaffected by this protected feature.
- [x] Auditability requirements are documented for draft-save outcomes.

## Project Structure

### Documentation (this feature)

```text
/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/
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

**Structure Decision**: Keep endpoint parsing and response shaping in presentation, draft policy/validation/concurrency behavior in business, and persistence/repository concerns in data to preserve constitutional layer boundaries.

## Phase 0: Outline & Research

Research tasks dispatched from technical context dependencies and integrations:
- Find best practices for draft-save validation boundaries (provided-field + minimal baseline) in staged workflows.
- Research deterministic last-write-wins patterns for concurrent same-record updates in PostgreSQL-backed APIs.
- Find best practices for author-ownership enforcement on save and resume retrieval paths.
- Research audit-event schema for draft-save outcomes without sensitive payload leakage.
- Research backup/restore handling for versioned draft snapshots.

Phase 0 output: `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/research.md` with decisions, rationale, and alternatives.

## Phase 1: Design & Contracts

Design outputs generated from spec and research:
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/data-model.md`
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/contracts/submission-drafts.openapi.yaml`
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/specs/006-save-submission-draft/quickstart.md`

Agent context update command:
- `/Users/indy/Desktop/ECE 493 Lab/ECE 493 Lab 2/.specify/scripts/bash/update-agent-context.sh codex`

## Post-Design Constitution Re-Check

- [x] Design preserves three-layer architecture boundaries across draft-save and resume workflows.
- [x] Contracts enforce authenticated author access, ownership checks, and explicit validation/authorization errors.
- [x] Security posture includes encrypted transport assumptions, encrypted draft persistence, and no plaintext payload logging.
- [x] Reliability safeguards include deterministic last-write-wins behavior and preservation of last valid draft on failure.
- [x] Backup/restore impact and auditability are represented in model and contract-level behavior.
- [x] Traceability remains explicit to UC-06 and AT-UC06-01/02.

## Phase 2 Planning Stop

Planning is complete through Phase 1 design outputs. Task decomposition is intentionally deferred to `/speckit.tasks`.

## Complexity Tracking

No constitution violations identified; no waiver required.
