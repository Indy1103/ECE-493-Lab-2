# Feature Specification: Access Assigned Paper for Review

**Feature Branch**: `009-access-assigned-paper`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Allow a referee to access assigned papers and their review forms after invitation acceptance, including no-assignment and unavailable-paper alternative flows for UC-09 with traceability to AT-UC09-01/02/03."

## Clarifications

### Session 2026-02-10

- Q: If assignment status changes between list retrieval and paper selection, should access be revalidated live or honor the earlier list snapshot? → A: Revalidate assignment and availability live at selection; if invalid, deny access with explicit reason and return updated assignment list.
- Q: For direct paper-access attempts to papers not assigned to the referee, should feedback be explicit authorization failure or generic unavailability? → A: Return a generic paper-unavailable/not-found outcome that does not confirm assignment existence.
- Q: If assigned paper metadata is available but review form retrieval fails, should the system allow partial access or block the attempt? → A: Block the attempt atomically; do not allow paper access without its review form for that request.
- Q: When a referee session expires before requesting assigned papers, what is the required user-visible outcome? → A: Return session-expired/401, redirect to login, and require retry after re-authentication.

## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Access Assigned Paper (Priority: P1)

A logged-in referee opens their assigned papers list and accesses one assigned paper with its review form.

**Why this priority**: This is the primary UC-09 success path needed for referees to perform reviews.

**Related Use Cases**: UC-09 (main success flow, steps 1-4)
**Related Acceptance Tests**: AT-UC09-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With a logged-in referee who has at least one assigned paper, request assigned papers, select one paper, and verify paper plus review form access.

**Acceptance Scenarios**:

1. **Given** a logged-in referee with assigned papers, **When** the referee requests their assignments, **Then** the system displays the assigned paper list.
2. **Given** a displayed assigned paper list, **When** the referee selects an assigned paper, **Then** the system provides access to that paper and its associated review form.

---

### User Story 2 - Handle No Assigned Papers (Priority: P1)

A logged-in referee with no assignments receives explicit feedback that no papers are currently assigned.

**Why this priority**: This is a required UC-09 alternative flow and prevents ambiguous user state when no review work exists.

**Related Use Cases**: UC-09 (extension 2a)
**Related Acceptance Tests**: AT-UC09-02
**Architecture Layers Impacted**: presentation, business

**Independent Test**: With a logged-in referee who has no assigned papers, request assigned papers and verify explicit no-assignment message and no accessible paper/form.

**Acceptance Scenarios**:

1. **Given** a logged-in referee with no assigned papers, **When** the referee requests assigned papers, **Then** the system informs the referee that no papers are currently assigned.

---

### User Story 3 - Handle Unavailable Assigned Paper (Priority: P2)

A logged-in referee is informed when a previously assigned paper can no longer be accessed for review.

**Why this priority**: This is a required UC-09 alternative flow that prevents invalid review access and clarifies failure outcome.

**Related Use Cases**: UC-09 (extension 3a)
**Related Acceptance Tests**: AT-UC09-03
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With a logged-in referee and an assigned paper that has become unavailable, select that paper and verify explicit unavailability message and no review form access.

**Acceptance Scenarios**:

1. **Given** a logged-in referee with an assigned paper that is unavailable, **When** the referee selects that paper, **Then** the system informs the referee the paper cannot be accessed and terminates that access attempt.

---

### Edge Cases

- Referee requests assigned papers after session expiration.
- Referee attempts to access a paper not assigned to their account.
- Assignment status changes between list retrieval and paper selection.
- Multiple concurrent access requests target the same assigned paper.
- Review form retrieval fails while paper metadata is available; system blocks the entire access attempt and returns unavailable outcome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a logged-in referee to request their assigned papers for review.
- **FR-002**: The system MUST present the list of papers currently assigned to the requesting referee.
- **FR-003**: The system MUST allow the referee to select a paper from their assigned list.
- **FR-004**: The system MUST provide access to the selected assigned paper when it is available for review.
- **FR-005**: The system MUST provide access to the review form associated with an accessible assigned paper.
- **FR-006**: The system MUST inform the referee when no papers are currently assigned.
- **FR-007**: The system MUST inform the referee when a selected assigned paper is no longer available for review.
- **FR-008**: The system MUST prevent access to paper content and review form when the selected paper is unavailable.
- **FR-009**: The system MUST restrict assigned-paper access to the referee account to which the assignment belongs and to assignments whose invitation status is accepted.
- **FR-010**: The system MUST return explicit user-visible outcomes for successful access and each failed access path using the canonical outcome terms defined by this specification.
- **FR-011**: When a referee selects a paper, the system MUST revalidate assignment ownership and paper availability against current state; if invalid, the system MUST deny access, present an explicit reason, and return an updated assigned-paper list view.
- **FR-012**: For direct access attempts to non-owned or non-assigned papers, the system MUST return canonical `UNAVAILABLE_OR_NOT_FOUND` outcome and MUST NOT disclose whether an assignment exists.
- **FR-013**: Access to an assigned paper and its review form MUST be atomic for a request; if either resource cannot be retrieved, the system MUST deny access to both and return an unavailable outcome.
- **FR-014**: If the referee session is expired or invalid when requesting assignments or selecting a paper, the system MUST return `401 Unauthorized` with outcome term `SESSION_EXPIRED`, require re-authentication, and disclose no paper or assignment data in the response.
- **FR-015**: The specification's canonical denial outcome terms MUST be applied consistently across all access flows:
  - `UNAVAILABLE`: selected assigned paper/review form is unavailable for the authorized referee.
  - `UNAVAILABLE_OR_NOT_FOUND`: direct access attempt to non-owned or non-assigned paper where assignment existence is not disclosed.
  - `SESSION_EXPIRED`: request rejected due to expired or invalid authenticated session.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: All assigned-paper and review-form access actions MUST use encrypted transport.
- **SPR-002**: Assignment and review-access records containing sensitive reviewer/paper linkage data MUST be protected at rest.
- **SPR-003**: Assigned-paper access flows MUST NOT expose sensitive paper or reviewer data in plaintext logs or error payloads.
- **SPR-004**: Only authorized referee accounts with accepted invitations MUST be able to access assigned-paper and review-form resources for their own assignments.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: Assigned-paper access requests MUST handle concurrent access safely without exposing unauthorized or stale assignment data.
- **RAR-002**: Access failures MUST produce explicit user-visible outcomes using canonical denial terms (`UNAVAILABLE`, `UNAVAILABLE_OR_NOT_FOUND`, `SESSION_EXPIRED`) or explicit empty-list outcome for no assignments.
- **RAR-003**: Assigned-paper access and failure outcomes MUST emit auditable records for success and failure paths.
- **RAR-004**: Assignment and review-access records used by this feature MUST be included in documented backup and recovery procedures.
- **RAR-005**: If assignment availability changes during access flow, the system MUST preserve a consistent final user-visible outcome for that request.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: Assigned-paper presentation, access rules, and persistence responsibilities MUST remain separated by layer boundaries.
- **AMR-002**: Access and ownership validation rules MUST be centralized in business logic and reused across assigned-paper entry paths.
- **AMR-003**: Feature behavior MUST remain traceable to UC-09 and AT-UC09-01/02/03.
- **AMR-004**: User-visible access outcome messaging MUST remain consistent across success and alternative flows.

### Assumptions

- Referee assignments are created by prior invitation acceptance workflow before this feature is invoked.
- Each review-accessible assignment links one referee, one paper, and one review form context.
- Logged-in referee identity is established by existing CMS authentication mechanisms.
- Authenticated identity assurance for this feature relies on existing CMS session validation that binds each request to a unique referee user ID and role claim before assignment data is returned.
- Expired or invalid sessions are rejected at the service boundary before any assignment existence, paper metadata, or review-form context is disclosed.

### Dependencies

- UC-09 is the source of truth for assigned-paper access behavior.
- AT-UC09-01, AT-UC09-02, and AT-UC09-03 are the source of truth for acceptance validation.
- Existing assignment data and review-form availability indicators are maintained by upstream workflows.

### Key Entities *(include if feature involves data)*

- **Referee Assignment**: A mapping between a referee and a paper indicating that the referee is assigned to review it.
- **Assigned Paper Access View**: The user-visible representation of assigned paper metadata available to the assigned referee.
- **Review Form**: The structured review artifact linked to an assigned paper and made available when paper access is valid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid assigned-paper access requests by eligible referees result in paper and review-form availability within 5 seconds.
- **SC-002**: 100% of tested no-assignment scenarios produce explicit no-assigned-papers messaging and no paper/form access.
- **SC-003**: 100% of tested unavailable-paper scenarios produce explicit unavailability messaging and block paper/form access.
- **SC-004**: 100% of tested unauthorized direct-access attempts to non-owned assignments are denied with `UNAVAILABLE_OR_NOT_FOUND` feedback and no assignment-existence disclosure.
- **SC-005**: 100% of tested concurrent assignment-state-change scenarios return a consistent final outcome without contradictory access results.
- **SC-006**: 100% of tested expired-session access attempts return `401 Unauthorized` with `SESSION_EXPIRED` outcome and no paper/assignment data disclosure.
