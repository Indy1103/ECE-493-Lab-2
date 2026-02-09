# Quickstart: Public Conference Announcement Access

## Purpose

Validate UC-01 behavior and constitutional constraints for public announcement viewing before implementation tasks proceed.

## Prerequisites

- Feature branch: `001-view-conference-announcements`
- Node.js and package manager configured for the project
- PostgreSQL instance available for announcement data
- Browser test runners for Chrome and Firefox

## 1. Contract-first and test-first setup

1. Author failing contract tests for `GET /api/public/announcements` using `contracts/public-announcements.openapi.yaml`.
2. Author failing integration tests for:
   - announcements available (`AVAILABLE`)
   - no announcements (`EMPTY`)
   - retrieval failure (`503` with explicit message)
3. Author failing security test confirming non-public announcements are never returned to anonymous users.
4. Author failing performance test enforcing `p95 <= 2s` under 100 concurrent anonymous users.

## 2. Implement by layer

1. Data layer: query eligible announcements (`is_public` + active publish window).
2. Business layer: map data result to deterministic states (`AVAILABLE`, `EMPTY`, `RETRIEVAL_FAILURE`).
3. Presentation/API layer: return contract-compliant responses and explicit user-visible messages.
4. Observability: emit structured failure logs, retrieval-failure metric, and alert rule (>5% for 5 minutes).

## 3. Verification checklist

1. Anonymous users can access announcements without login.
2. Available announcements are readable.
3. Empty state message appears when no eligible announcements exist.
4. Retrieval failures show explicit unavailability messaging distinct from empty state.
5. Non-public announcements are not exposed.
6. Contract tests, integration tests, and browser tests pass.

## 4. Traceability

- Use case: `UC-01`
- Acceptance tests: `AT-UC01-01`, `AT-UC01-02`
- Spec: `spec.md`
- Plan: `plan.md`
- Research: `research.md`
- Data model: `data-model.md`
- Contract: `contracts/public-announcements.openapi.yaml`
