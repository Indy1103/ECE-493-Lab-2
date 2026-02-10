# Feature Specification: Author Schedule Access

**Feature Branch**: `016-author-receive-schedule`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "**Goal in Context**: Allow an author of an accepted paper to receive the final conference schedule so that they know when and where to present. **Scope**: Conference Management System (CMS) **Level**: User Goal **Primary Actor**: Author **Secondary Actors**: Editor **Trigger**: The system publishes the final conference schedule. * The Author has received and is aware of the final conference schedule for their accepted paper. * The Author does not receive the conference schedule and is unaware of their presentation details. * The Author has at least one accepted paper. * A final conference schedule has been created and published. 1. The system notifies the Author that the final conference schedule is available. 2. The Author requests to view the conference schedule. 3. The system presents the conference schedule to the Author. * **1a**: The conference schedule has not been finalized. * 1a1: The system informs the Author that the schedule is not yet available. * 1a2: The use case terminates with the Failed End Condition. * **Priority**: High * **Frequency**: Occasional * **Open Issues**: None This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-16**. --- **Validated Scenario ID:** UC-16-S1 **Description:** Verify that an author with an accepted paper can successfully receive and view the final conference schedule after it is published. **Preconditions:** - The CMS is operational. - The Author is registered and logged in. - The Author has at least one accepted paper. - The final conference schedule has been created and published. **Test Steps:** 1. The system notifies the Author that the final conference schedule is available. 2. The Author requests to view the conference schedule. 3. The system presents the conference schedule to the Author. **Expected Results:** - The Author is notified that the final schedule is available. - The conference schedule is displayed to the Author. - The schedule includes the Author’s presentation details. - The Author understands when and where their paper will be presented. --- **Validated Scenario ID:** UC-16-S2 **Description:** Verify system behavior when an author attempts to access the conference schedule before it is finalized. **Preconditions:** - The CMS is operational. - The Author is registered and logged in. - The Author has at least one accepted paper. - The conference schedule has not yet been finalized or published. **Test Steps:** 1. The Author attempts to view the conference schedule. 2. The system checks the publication status of the schedule. **Expected Results:** - The system informs the Author that the conference schedule is not yet available. - The conference schedule is not displayed. - The Author remains unaware of presentation timing and location. --- - ✅ **Every scenario has at least one corresponding acceptance test case**: - UC-16-S1 → AT-UC16-01 - UC-16-S2 → AT-UC16-02 - ✅ **All main and alternative flows of UC-16 are covered** - ✅ **Only behavior described in the scenarios is tested**"
## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Receive and View Final Schedule (Priority: P1)

An author with an accepted paper is notified when the final conference schedule is published, requests to view it, and sees their presentation details.

**Why this priority**: Authors need definitive presentation details to prepare and attend; this is the primary UC-16 success path.

**Related Use Cases**: UC-16 (main success flow)
**Related Acceptance Tests**: AT-UC16-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With a published final schedule and an accepted-paper author, verify the author is notified and can view the schedule with their presentation details.

**Acceptance Scenarios**:

1. **Given** the final conference schedule is published and the author has an accepted paper, **When** the system sends the availability notification, **Then** the author is informed that the final schedule can be viewed.
2. **Given** the author has been notified, **When** the author requests the schedule, **Then** the schedule is displayed and includes the author’s presentation time and location.

---

### User Story 2 - Schedule Not Yet Published (Priority: P1)

An author attempts to access the conference schedule before it is finalized and is informed it is not yet available.

**Why this priority**: UC-16 alternative flow requires explicit handling when the schedule is not published.

**Related Use Cases**: UC-16 (alternative flow 1a)
**Related Acceptance Tests**: AT-UC16-02
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: With no published final schedule, attempt to view the schedule and confirm an explicit unavailability message is shown.

**Acceptance Scenarios**:

1. **Given** the schedule is not finalized or published, **When** the author requests the schedule, **Then** the system informs the author that it is not yet available and does not display it.

---

### Edge Cases

- The author is authenticated but has no accepted papers.
- The author has multiple accepted papers with multiple sessions.
- The final schedule is published, then later retracted or replaced.
- Notification delivery fails or is delayed beyond the 24-hour retry window.
- An unauthenticated user attempts to access the schedule.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST notify authors with accepted papers when the final conference schedule is published.
- **FR-002**: The system MUST allow an authenticated author to request to view the final conference schedule.
- **FR-003**: The system MUST present the final conference schedule to the author when it is published.
- **FR-004**: The displayed schedule MUST include the author’s presentation details (time and location).
- **FR-005**: When the schedule is not finalized or published, the system MUST inform the author that it is not yet available.
- **FR-006**: The system MUST preserve traceability of this feature behavior to UC-16 and AT-UC16-01/02.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: All in-transit data for this feature MUST use encrypted transport.
- **SPR-002**: Sensitive data stored or updated by this feature MUST be encrypted at rest.
- **SPR-003**: Credentials and paper files handled by this feature MUST NOT appear in plaintext in storage, transport, or logs.
- **SPR-004**: Access to schedule visibility and notification actions MUST enforce role-based authorization checks for authenticated authors.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: The feature MUST handle concurrent author requests without corrupting schedule visibility state.
- **RAR-002**: The feature MUST define backup/restore impact for any schedule publication data used for author access.
- **RAR-003**: The feature MUST include failure handling that surfaces explicit user-visible errors.
- **RAR-004**: Reliability behavior MUST be prioritized over non-essential or experimental behavior.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: Implementation MUST preserve separation between presentation, business, and data layers.
- **AMR-002**: Business logic MUST be expressed through clear domain/service objects.
- **AMR-003**: Established libraries MUST be preferred to custom implementations unless justified.
- **AMR-004**: Design and logging decisions MUST support auditability and long-term maintenance.

### Key Entities *(include if feature involves data)*

- **ConferenceSchedule**: The final schedule with session times and locations.
- **SchedulePublication**: The published status and availability of the final schedule.
- **AuthorNotification**: The record that an author was informed of schedule availability.

### Assumptions

- Authors are registered and can authenticate using existing CMS mechanisms.
- The final schedule is published by an editor workflow outside this feature.
- Authors only need visibility for schedules tied to their accepted papers.

### Dependencies

- UC-16 defines the source-of-truth behavior for this feature.
- AT-UC16-01 and AT-UC16-02 define the acceptance validation baseline.
- Existing acceptance decisions for papers provide “accepted” status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of authors with accepted papers receive a schedule-availability notification within 5 minutes of publication.
- **SC-002**: At least 99% of author schedule view requests succeed when the schedule is published.
- **SC-003**: 100% of tested attempts to view an unpublished schedule result in a clear unavailability message.
- **SC-004**: 100% of validated flows work in current Chrome and Firefox releases.
