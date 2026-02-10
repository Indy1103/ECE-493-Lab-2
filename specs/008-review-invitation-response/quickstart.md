# Quickstart: Respond to Review Invitation (UC-08)

## Prerequisites

- Node.js LTS and npm installed.
- PostgreSQL available for local development.
- TLS enabled for non-local environments.
- Seed data includes registered referees and pending review invitations tied to papers.

## Implementation Flow (TDD)

1. Write failing acceptance tests mapped to `AT-UC08-01` and `AT-UC08-02`.
2. Add failing integration tests for:
   - invited-referee-only access control,
   - retrieval of minimum required invitation details,
   - successful acceptance with assignment creation,
   - successful rejection with no assignment creation,
   - response-recording failure preserving pending invitation and no assignment side effects,
   - first-valid-response-wins under near-simultaneous submissions.
3. Implement presentation-layer endpoints using `contracts/review-invitation-response.openapi.yaml`.
4. Implement business-layer invitation response rules (pending-only response, ownership checks, deterministic conflict handling).
5. Implement data-layer transactional persistence for invitation status, response attempts, and acceptance-triggered assignments.
6. Implement structured audit logging for response success/failure/conflict outcomes without sensitive payload leakage.
7. Run full test and lint checks.

## Validation Checklist

- Invited referee can accept pending invitation and receives explicit confirmation.
- Acceptance creates reviewer assignment for the invited paper.
- Invited referee can reject pending invitation and remains unassigned.
- Non-invited users and unauthenticated users are rejected explicitly.
- Failed recording attempts leave invitation pending and produce no assignment side effects.
- Near-simultaneous responses on one invitation preserve first-valid-response-wins state.
- No sensitive reviewer data appears in plaintext logs or error payloads.
