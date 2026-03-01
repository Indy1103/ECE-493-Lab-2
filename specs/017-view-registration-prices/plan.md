# Implementation Plan: View Registration Prices

**Branch**: `017-view-registration-prices` | **Date**: 2026-02-10 | **Spec**: `specs/017-view-registration-prices/spec.md`
**Input**: Feature specification from `specs/017-view-registration-prices/spec.md`

## Summary

Provide public read-only access for attendees to view the published registration price list,
including multiple attendance options, and return explicit unavailability messaging when no
price list is published.

## Technical Context

**Language/Version**: TypeScript (frontend + backend)
**Primary Dependencies**: React 18, Fastify, Prisma (PostgreSQL), Zod, Pino, prom-client,
rate-limiter-flexible (existing stack)
**Storage**: PostgreSQL for registration price lists and price entries
**Testing**: Unit, integration, contract, and end-to-end tests (Chrome + Firefox)
**Target Platform**: Browser-based web app + backend services
**Project Type**: Web (three-layer architecture: presentation/business/data)
**Performance Goals**: 95% of price list views render within 5 seconds without weakening
integrity or confidentiality
**Constraints**: TDD first, library-first, OOP domain design, strict RBAC, explicit
validation errors, no plaintext secrets/files, backup and recovery, 24/7 reliability
**Scale/Scope**: Public attendee traffic with periodic spikes near registration deadlines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Test-first strategy is defined: failing tests are listed before implementation tasks.
- [x] Acceptance traceability is defined: each story maps to `UseCases.md` and `TestSuite.md` IDs.
- [x] Layer compliance is explicit: impacted presentation, business, and data components are identified.
- [x] Library-first decisions are documented; custom implementations include justification.
- [x] Security controls cover TLS in transit, encryption at rest, and no plaintext credentials/paper files/logs.
- [x] RBAC impact is defined, including privileged action restrictions and authorization failure behavior.
- [x] Validation rules and explicit user-visible error responses are defined.
- [x] Reliability coverage includes concurrency behavior, availability considerations, and backup/restore impact.
- [x] Public information access remains available without authentication.
- [x] Auditability requirements are documented (security/event logs and traceable design decisions).

## Project Structure

### Documentation (this feature)

```text
specs/017-view-registration-prices/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── presentation/
│   ├── business/
│   ├── data/
│   ├── security/
│   └── shared/
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── src/
│   ├── presentation/
│   ├── business/
│   ├── data/
│   └── shared/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/

infra/
├── db/
│   ├── migrations/
│   └── backup/
└── ops/
    ├── monitoring/
    └── recovery/
```

**Structure Decision**: Use existing three-layer backend and frontend structure with
price list retrieval rules in the business layer and persistence in the data layer. No
deviations from constitutional boundaries.

## Phase 0: Outline & Research

### Research Tasks

- Confirm price list retrieval patterns in existing CMS public endpoints.
- Verify RBAC patterns for public access endpoints (if any) in existing auth stack.
- Identify expected concurrency behavior for price list access during traffic spikes.

### Research Output

- `specs/017-view-registration-prices/research.md` with decisions, rationale, and alternatives.

## Phase 1: Design & Contracts

### Data Model

- Define registration price list entities and relationships in `data-model.md`.
- Ensure published status and availability checks are represented.

### API Contracts

- Document endpoints for price list retrieval in `contracts/openapi.yaml`.
- Include explicit error responses for unavailable price lists.

### Agent Context Update

- Run `.specify/scripts/bash/update-agent-context.sh codex` after artifacts are generated.

## Phase 2: Planning Output

- `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`, updated agent context file.

## Risks & Mitigations

- Risk: Price list access spikes cause slow response times. Mitigation: optimize read queries
  and use caching where appropriate without violating freshness requirements.
- Risk: Price list data inconsistency across updates. Mitigation: enforce transactional
  updates and clear published status rules.
