# Feature Specification: Record Final Decision

**Feature Branch**: `012-record-final-decision`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Allow an editor to record a final acceptance or rejection decision for a paper so that the author is informed of the outcome, including gating on completed reviews for UC-12 with traceability to AT-UC12-01 and AT-UC12-02."

## Clarifications

### Session 2026-02-10

- Q: What final decision options are allowed for UC-12? → A: Accept or Reject only.
- Q: Can editors change a final decision after it is recorded? → A: Final decision is immutable once recorded.
- Q: If reviews are pending, should completed review content be shown? → A: Do not show review content; only show decision not allowed yet.

## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Record Final Decision (Priority: P1)

A logged-in editor selects a reviewed paper with all required referee reviews completed and records a final acceptance or rejection decision that is saved and communicated to the author.

**Why this priority**: This is the primary UC-12 success path required to finalize paper outcomes.

**Related Use Cases**: UC-12 (main success flow, steps 1-5)
**Related Acceptance Tests**: AT-UC12-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With a logged-in editor and a paper whose required reviews are complete, record an acceptance/rejection and verify the decision is saved and the author is notified.

**Acceptance Scenarios**:

1. **Given** a logged-in editor and a submitted paper with all required reviews completed, **When** the editor selects a final acceptance or rejection decision, **Then** the system records the decision and confirms it was saved.
2. **Given** a final decision is recorded, **When** the system completes the decision workflow, **Then** the author is notified of the acceptance or rejection outcome.

---

### User Story 2 - Block Decision Until Reviews Complete (Priority: P1)

A logged-in editor attempting to record a final decision before all required reviews are complete is informed that a decision cannot be made yet and no decision is recorded or communicated.

**Why this priority**: UC-12 extension 1a prevents premature final decisions before review completion.

**Related Use Cases**: UC-12 (extension 1a)
**Related Acceptance Tests**: AT-UC12-02
**Architecture Layers Impacted**: presentation, business

**Independent Test**: With a logged-in editor and a paper with pending required reviews, attempt to record a decision and verify the system blocks it and does not notify the author.

**Acceptance Scenarios**:

1. **Given** a logged-in editor and a submitted paper with pending required reviews, **When** the editor attempts to record a final decision, **Then** the system informs the editor that a decision cannot be made yet.
2. **Given** pending required reviews exist, **When** a final decision attempt is made, **Then** no decision is recorded and the author is not notified.

### Edge Cases

- The requesting user is authenticated but does not have editor privileges.
- The selected paper identifier does not correspond to a submitted paper.
- A decision request races with a review completion update.
- The decision has already been finalized and the editor attempts to re-decide.
- Author notification delivery fails after decision persistence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a logged-in editor to select a submitted paper with completed reviews and record a final acceptance or rejection decision.
- **FR-002**: The system MUST verify all required referee reviews are completed before allowing a final decision to be recorded.
- **FR-003**: When a final decision is recorded, the system MUST persist the decision status for the paper.
- **FR-004**: The system MUST present only two final decision options to the editor: acceptance or rejection.
- **FR-005**: The system MUST confirm to the editor that the decision has been recorded.
- **FR-006**: When required reviews are pending, the system MUST inform the editor that a final decision cannot be made yet.
- **FR-007**: When required reviews are pending, the system MUST NOT record any final decision.
- **FR-008**: The system MUST notify the author when a final decision is successfully recorded.
- **FR-009**: The system MUST preserve traceability of this feature behavior to UC-12 and AT-UC12-01/02.
- **FR-010**: Once a final decision is recorded, the system MUST prevent further edits to that decision.
- **FR-011**: When required reviews are pending, the system MUST NOT present any review content for that paper.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: All decision-recording interactions for this feature MUST use encrypted transport.
- **SPR-002**: Decision records and associated paper data accessed by this feature MUST be protected at rest.
- **SPR-003**: Decision outcomes and error paths MUST NOT expose sensitive data in plaintext logs or error payloads.
- **SPR-004**: Access to final decision recording MUST enforce role-based authorization for editor privileges.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: The feature MUST handle concurrent decision-recording requests without inconsistent or duplicate final decisions.
- **RAR-002**: Decision recording MUST include backup and recovery impact coverage for stored decision data.
- **RAR-003**: Failure paths MUST provide explicit user-visible errors explaining why the decision cannot be recorded.
- **RAR-004**: Reliability behavior MUST be prioritized over non-essential or experimental behavior.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: The feature MUST preserve separation between presentation, business, and data responsibilities.
- **AMR-002**: Decision validation and recording rules MUST be centralized in business logic.
- **AMR-003**: Established platform libraries and shared workflow patterns MUST be used unless a documented exception is required.
- **AMR-004**: Design and logging decisions MUST support auditability and long-term maintenance.

### Key Entities *(include if feature involves data)*

- **PaperDecision**: The final acceptance or rejection outcome recorded for a paper.
- **DecisionRequest**: The editor-initiated request context to record a final decision.
- **DecisionStatus**: The paper-level status indicating acceptance or rejection is finalized.

### Assumptions

- The number of required referee reviews per paper is already defined by conference policy.
- Review completion status is maintained by existing review workflows.
- Author notification delivery mechanisms already exist in the CMS.

### Dependencies

- UC-12 defines the source-of-truth behavior for this feature.
- AT-UC12-01 and AT-UC12-02 define the acceptance validation baseline.
- Existing review completion data and notification services provide required inputs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of eligible decision-recording requests complete and confirm success within 3 seconds.
- **SC-002**: 100% of tested decision attempts with pending reviews are blocked with a clear message and no decision recorded.
- **SC-003**: 100% of tested successful decisions result in author notification delivery or a visible notification failure message.
- **SC-004**: The decision-recording flow is validated in current Chrome and Firefox releases.
