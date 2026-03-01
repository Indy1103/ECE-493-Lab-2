# Feature Specification: Save Paper Submission Draft

**Feature Branch**: `006-save-submission-draft`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Allow an author to save a partially completed paper submission so that it can be completed incrementally at a later time (UC-06)."

## Clarifications

### Session 2026-02-10

- Q: How many drafts should be maintained per author and in-progress submission? → A: Maintain exactly one current draft per (author, in-progress submission); each save overwrites the current draft state.
- Q: Should draft save enforce full final-submission validation rules? → A: Validate provided fields and a minimal draft-required baseline only, not full final-submission completeness rules.
- Q: What is the minimal required field baseline for draft save? → A: Title is required.
- Q: How should concurrent valid draft saves for the same draft be resolved? → A: Deterministic last-write-wins with an audit trail for each save attempt.

## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Save Valid Draft State (Priority: P1)

An authenticated author saves a partially completed paper submission draft when submitted draft information satisfies draft validation rules.

**Why this priority**: This is the primary UC-06 outcome that enables incremental author workflows.

**Related Use Cases**: UC-06 (main success scenario, steps 1-4)
**Related Acceptance Tests**: AT-UC06-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With an authenticated author and an in-progress submission, save a valid draft payload and verify the system persists draft state and confirms success.

**Acceptance Scenarios**:

1. **Given** an authenticated author with an in-progress submission, **When** the author requests to save draft state with valid draft information, **Then** the system validates and saves the draft state.
2. **Given** a successful draft save, **When** the save completes, **Then** the author receives explicit confirmation that draft state is saved.

---

### User Story 2 - Reject Invalid Draft Save Request (Priority: P1)

An authenticated author receives explicit validation feedback when draft information violates submission rules and the draft is not saved.

**Why this priority**: This is the required alternate flow in UC-06 and prevents invalid draft states from being persisted.

**Related Use Cases**: UC-06 (extension 2a, steps 2a1-2a2)
**Related Acceptance Tests**: AT-UC06-02
**Architecture Layers Impacted**: presentation, business

**Independent Test**: With an authenticated author and an in-progress submission, submit invalid draft information and verify the system rejects save and reports validation issues.

**Acceptance Scenarios**:

1. **Given** an authenticated author requests draft save, **When** draft information violates submission rules, **Then** the system does not save draft state and reports validation issues.
2. **Given** a rejected draft save due to validation issues, **When** the request ends, **Then** no resumable saved draft is created from that failed request.

---

### User Story 3 - Resume From Saved Draft State (Priority: P2)

An authenticated author can later continue working from the most recently saved valid draft state.

**Why this priority**: UC-06 success outcomes require that a saved draft can be used later to continue submission work.

**Related Use Cases**: UC-06 (success end condition)
**Related Acceptance Tests**: AT-UC06-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: After a successful draft save, return later with the same authenticated author and verify saved draft data is available for continuation.

**Acceptance Scenarios**:

1. **Given** a previously saved valid draft state, **When** the author returns to continue submission, **Then** the system provides the saved draft state for continued editing.

### Edge Cases

- The author attempts to save draft state after session expiration.
- The author attempts to save draft state when no in-progress submission exists.
- Two save requests for the same draft are submitted near-simultaneously.
- A save request fails after validation but before completion; the system must avoid claiming save success.
- The author submits an empty draft payload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated author with an in-progress submission to request draft save.
- **FR-002**: The system MUST evaluate provided draft information against applicable submission rules before persisting draft state.
- **FR-003**: The system MUST save draft state only when draft information satisfies draft validation rules.
- **FR-004**: The system MUST provide explicit confirmation to the author when draft state is successfully saved.
- **FR-005**: The system MUST reject draft save requests that violate submission rules and MUST provide explicit validation issue feedback.
- **FR-006**: The system MUST NOT create or update resumable draft state for requests that fail validation.
- **FR-007**: The system MUST make successfully saved draft state available for the same author to resume later.
- **FR-008**: The system MUST reject draft save attempts from unauthenticated users or expired sessions with explicit user-visible authorization messaging.
- **FR-009**: The system MUST maintain exactly one current draft per `(author, in-progress submission)` and MUST update that current draft on each successful save.
- **FR-010**: The system MUST validate draft save requests against provided-field rules plus a minimal draft-required baseline and MUST NOT require full final-submission completeness for draft save.
- **FR-011**: The minimal draft-required baseline for draft save MUST require a non-empty title field.
- **FR-012**: Draft-save validation rules MUST be sourced from the active CMS submission policy version for the conference cycle, and the applied policy version MUST be recorded with each successful draft save.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: Draft submission data MUST be protected in transit using encrypted transport.
- **SPR-002**: Saved draft submission data containing manuscript content or sensitive metadata MUST be protected at rest.
- **SPR-003**: Draft payload content MUST NOT be exposed in plaintext in logs or error payloads.
- **SPR-004**: Draft save and resume access MUST enforce author ownership checks so an author can access only their own drafts.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: Concurrent draft save requests for the same in-progress submission MUST NOT corrupt saved draft state and MUST resolve valid concurrent saves with deterministic last-write-wins behavior.
- **RAR-002**: Failed validation or operational failures during draft save MUST preserve the most recent previously saved valid draft state.
- **RAR-003**: Saved draft records created by this feature MUST be included in documented backup and restore procedures.
- **RAR-004**: Draft save failures MUST return explicit user-visible guidance so authors can retry or correct input.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: Feature behavior MUST preserve separation between presentation, business, and data responsibilities.
- **AMR-002**: Draft validation rules MUST be maintained in authoritative business logic.
- **AMR-003**: Feature requirements and scenarios MUST remain traceable to UC-06 and AT-UC06-01/02.
- **AMR-004**: User-visible draft save messaging MUST remain consistent across all supported draft-save entry paths in this feature scope.

### Assumptions

- The author has already started a paper submission before using draft save.
- Draft save stores partial state intended only for later continuation by the same author.
- Submission rules for draft validation are defined by CMS submission policy and include provided-field checks plus a minimal draft-required baseline that differs from full final-submission acceptance rules.

### Dependencies

- UC-06 remains the source of truth for draft-save user-facing behavior.
- AT-UC06-01 and AT-UC06-02 remain the source of truth for acceptance-level validation behavior.
- Active CMS submission policy version for the conference cycle is the authoritative source for draft-save validation rules.
- The paper submission workflow provides an in-progress submission context for draft save requests.

### Key Entities *(include if feature involves data)*

- **Submission Draft**: Persisted partial submission state linked to one author and one in-progress submission context; exactly one current draft is maintained for each `(author, in-progress submission)` pair.
- **Draft Snapshot**: Versioned representation of the saved metadata/content at a specific save event.
- **Draft Save Attempt**: Record of a draft-save request outcome, including success or validation failure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid draft save attempts complete successfully and return explicit save confirmation during acceptance validation.
- **SC-002**: 100% of draft save attempts with rule violations are rejected with explicit validation issue feedback.
- **SC-003**: 100% of validation-failed draft save attempts leave no newly resumable saved state from that failed request.
- **SC-004**: 100% of successfully saved drafts are available for the same author to resume in follow-up validation checks.
- **SC-005**: 100% of tested authorization and operational failure scenarios provide explicit user-visible guidance without exposing sensitive payload content.
