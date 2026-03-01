# Feature Specification: Assign Referees to Submitted Papers

**Feature Branch**: `007-assign-paper-referees`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Allow an editor to assign referees to submitted papers so that each paper receives the required peer reviews (UC-07)."

## Clarifications

### Session 2026-02-10

- Q: For one assignment request containing multiple referee identifiers, what happens if at least one selected referee fails validation? → A: Atomic assignment: if any selected referee fails validation, reject the entire request and assign none.
- Q: If assignment persistence succeeds but invitation dispatch fails, should assignments be rolled back? → A: Assignment commit is authoritative; invitation failures do not undo assignments and must trigger explicit retryable failure handling.
- Q: How should duplicate referee identifiers in a single assignment request be handled? → A: Reject request when duplicate referee identifiers are present in the same submission, with explicit duplicate-entry feedback.
- Q: How should concurrent assignment attempts by editors against the same paper be resolved? → A: Pessimistic serialization per paper: process assignment attempts one-at-a-time for the same paper.

## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Assign Eligible Referees (Priority: P1)

An authenticated editor assigns one or more eligible referees to a submitted paper awaiting assignment.

**Why this priority**: This is the main UC-07 outcome needed to start peer review.

**Related Use Cases**: UC-07 (main success flow, steps 1-5)
**Related Acceptance Tests**: AT-UC07-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With an authenticated editor, a submitted paper awaiting assignment, and eligible referees, submit referee identifiers and verify assignment success plus invitation delivery.

**Acceptance Scenarios**:

1. **Given** a submitted paper awaiting referee assignment, **When** the editor submits eligible referee identifiers within allowed limits, **Then** the system assigns those referees and confirms success.
2. **Given** successful referee assignment, **When** assignment completes, **Then** the system sends review invitations to newly assigned referees.

---

### User Story 2 - Reject Workload-Violating Referee Assignment (Priority: P1)

An authenticated editor receives explicit feedback when attempting to assign a referee whose workload is already at or above the allowed maximum.

**Why this priority**: This is a required alternate flow in UC-07 and protects review quality and fairness.

**Related Use Cases**: UC-07 (extension 4a)
**Related Acceptance Tests**: AT-UC07-02
**Architecture Layers Impacted**: presentation, business

**Independent Test**: Attempt to assign a referee who has reached workload limit and verify rejection, explicit workload message, and no new assignment.

**Acceptance Scenarios**:

1. **Given** a paper awaiting assignment and a referee at workload limit, **When** the editor submits that referee identifier, **Then** the system rejects the assignment and reports the workload violation.
2. **Given** a workload-based rejection, **When** the editor retries with a different eligible referee, **Then** the workflow continues from referee selection.

---

### User Story 3 - Enforce Maximum Referees per Paper (Priority: P2)

An authenticated editor is prevented from assigning additional referees when a paper already has the maximum allowed referees.

**Why this priority**: This enforces UC-07 hard-stop behavior and prevents over-assignment.

**Related Use Cases**: UC-07 (extension 4b)
**Related Acceptance Tests**: AT-UC07-03
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: For a paper already at maximum assigned referees, attempt an additional assignment and verify explicit rejection and no new assignments.

**Acceptance Scenarios**:

1. **Given** a paper already at maximum referee count, **When** the editor attempts to assign another referee, **Then** the system rejects the request and informs the editor no additional referees can be assigned.

---

### Edge Cases

- Editor attempts assignment while session is expired or not authenticated.
- Editor provides one or more referee identifiers that do not correspond to assignable referees.
- Editor submits duplicate referee identifiers in one assignment request.
- Two editor assignment attempts target the same paper concurrently.
- Invitation dispatch fails after assignment validation; outcome messaging must be explicit and auditable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an authenticated editor to select a submitted paper awaiting referee assignment.
- **FR-002**: The system MUST present assignment options for the selected paper, including current assignment count and remaining available referee slots.
- **FR-003**: The system MUST accept referee identifiers from the editor for assignment to the selected paper.
- **FR-004**: The system MUST validate each requested referee assignment against assignment rules before persisting any new assignment.
- **FR-005**: The system MUST assign referees and provide explicit success confirmation when all submitted assignments are valid.
- **FR-006**: The system MUST send review invitations to referees newly assigned by a successful assignment request.
- **FR-007**: The system MUST reject assignment attempts for referees whose current workload meets or exceeds the allowed maximum and MUST provide explicit workload-violation feedback.
- **FR-008**: The system MUST reject assignment attempts when the paper has already reached its maximum allowed referee count and MUST provide explicit no-capacity feedback.
- **FR-009**: For rejected assignment attempts, the system MUST NOT create new referee assignments from that attempt.
- **FR-010**: After workload-based rejection, the system MUST allow the editor to resubmit with different referee selections.
- **FR-011**: Assignment limits (maximum workload per referee and maximum referees per paper) MUST be sourced from the active conference assignment policy for the paper's conference cycle.
- **FR-012**: Referee assignment requests containing multiple referee identifiers MUST be atomic; if any requested referee fails validation, the system MUST reject the entire request and persist no new referee assignments from that request.
- **FR-013**: Once referee assignments are successfully persisted, downstream invitation-delivery failures MUST NOT roll back those persisted assignments.
- **FR-014**: The system MUST reject assignment requests containing duplicate referee identifiers and MUST return explicit duplicate-entry validation feedback.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: All assignment and invitation actions MUST use encrypted transport.
- **SPR-002**: Persisted assignment records and invitation-related records containing sensitive reviewer information MUST be protected at rest.
- **SPR-003**: Assignment validation and invitation flows MUST NOT expose sensitive referee data in plaintext logs or error payloads.
- **SPR-004**: Only authorized editor roles MUST be allowed to perform referee assignment actions.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: Concurrent assignment requests for the same paper MUST NOT corrupt assignment state or exceed configured assignment limits.
- **RAR-002**: Assignment failures MUST return explicit user-visible outcomes indicating whether assignments were applied.
- **RAR-003**: Assignment and invitation actions MUST emit auditable outcome records for success and failure paths.
- **RAR-004**: Assignment records created by this feature MUST be included in documented backup and recovery procedures.
- **RAR-005**: Invitation-delivery failures after assignment persistence MUST produce explicit retryable operational handling without losing committed assignment state.
- **RAR-006**: Concurrent assignment attempts targeting the same paper MUST be serialized per paper so assignment validation and capacity checks are evaluated one request at a time.
- **RAR-007**: Retryable invitation handling MUST define retry owner, retry cadence or backoff strategy, maximum retry attempts, and terminal failure-state behavior.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: Assignment presentation, policy validation logic, and persistence responsibilities MUST remain separated by layer boundaries.
- **AMR-002**: Assignment-policy validation logic MUST be centralized in business logic and reused consistently across assignment entry paths.
- **AMR-003**: Feature behavior MUST remain traceable to UC-07 and AT-UC07-01/02/03.
- **AMR-004**: User-visible assignment outcome messages MUST be consistent across main and alternate flows.

### Assumptions

- Submitted papers eligible for assignment are those in an awaiting-assignment state defined by conference workflow policy.
- A referee receives at most one active assignment per paper.
- Assignment policy values are maintained outside this feature and are available at assignment-validation time.

### Dependencies

- UC-07 is the source of truth for assignment user-visible behavior.
- AT-UC07-01, AT-UC07-02, and AT-UC07-03 are the source of truth for acceptance validation.
- Active conference assignment policy defines workload and per-paper assignment limits.

### Key Entities *(include if feature involves data)*

- **Paper Assignment Candidate**: A submitted paper awaiting referee assignment, with current assignment count and capacity status.
- **Referee Workload Profile**: Current active review load for a referee used to validate assignment eligibility.
- **Referee Assignment**: Relationship linking a paper and referee with assignment status and assignment timestamp.
- **Review Invitation**: Notification record sent to an assigned referee requesting review participation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid UC-07-S1 assignment attempts result in persisted assignments and editor-visible success confirmation.
- **SC-002**: 100% of workload-violating UC-07-S2 attempts are rejected with explicit workload violation messaging and no new assignment creation.
- **SC-003**: 100% of over-capacity UC-07-S3 attempts are rejected with explicit no-capacity messaging and no new assignment creation.
- **SC-004**: 100% of successful assignment attempts trigger review invitation creation for each newly assigned referee.
- **SC-005**: 100% of tested concurrent assignment scenarios preserve assignment-limit integrity without conflicting outcomes.
