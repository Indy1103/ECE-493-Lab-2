# Feature Specification: Submit Paper Manuscript

**Feature Branch**: `005-submit-paper-manuscript`
**Created**: 2026-02-10
**Status**: Draft
**Input**: User description: "Allow an author to submit a paper manuscript with required metadata so it can enter review (UC-05)."

## Clarifications

### Session 2026-02-10

- Q: How should required metadata fields be defined for manuscript submission? → A: Fixed required metadata fields per submission cycle for all authors in that cycle.
- Q: How should manuscript files be persisted? → A: Store manuscript files in encrypted object storage and persist only file reference and integrity metadata in submission records.
- Q: What manuscript file format and size limits apply? → A: PDF only, maximum file size 20 MB.
- Q: How should duplicate manuscript submissions be handled in the same cycle? → A: Reject duplicate active submissions with same normalized title by same author in the same cycle.
- Q: What audit logging is required for manuscript submission attempts? → A: Log each submission attempt outcome with timestamp, author ID, submission ID (if created), and failure reason code, excluding manuscript content.

## User Scenarios & Testing *(mandatory)*

Every story in this section MUST be independently testable and MUST identify its traceability
links to `UseCases.md` and `TestSuite.md`.

### User Story 1 - Successful Manuscript Submission (Priority: P1)

An authenticated author submits required manuscript metadata and a valid manuscript file, and the system accepts the submission for review processing.

**Why this priority**: This is the core UC-05 value path that enables the review pipeline.

**Related Use Cases**: UC-05 (main success scenario, steps 1-5)
**Related Acceptance Tests**: AT-UC05-01
**Architecture Layers Impacted**: presentation, business, data

**Independent Test**: From an authenticated author session with paper submission open, submit complete valid metadata plus a valid manuscript file and verify the system confirms acceptance and makes the submission available for downstream review assignment.

**Acceptance Scenarios**:

1. **Given** an authenticated author and an open submission window, **When** the author submits complete valid metadata and a valid manuscript file, **Then** the system validates the payload and accepts the manuscript submission.
2. **Given** a successful submission, **When** confirmation is returned, **Then** the author receives explicit success feedback and the paper is available for referee assignment and review.

---

### User Story 2 - Metadata Validation Failure and Recovery (Priority: P1)

An authenticated author submits missing or invalid required metadata and receives explicit guidance to correct and resubmit.

**Why this priority**: This is required alternative behavior in UC-05 and prevents invalid submissions from entering review.

**Related Use Cases**: UC-05 (extension 4a, steps 4a1-4a2)
**Related Acceptance Tests**: AT-UC05-02
**Architecture Layers Impacted**: presentation, business

**Independent Test**: Submit a manuscript request with missing/invalid required metadata and verify rejection with clear metadata issue feedback and support for correction/resubmission.

**Acceptance Scenarios**:

1. **Given** an authenticated author requests submission, **When** required metadata is missing or invalid, **Then** the system rejects the submission and identifies the metadata issues.
2. **Given** a metadata validation rejection, **When** the author corrects metadata and resubmits, **Then** the system re-evaluates and proceeds according to the updated submission validity.

---

### User Story 3 - Manuscript File Validation Failure and Recovery (Priority: P1)

An authenticated author submits valid metadata with an invalid manuscript file and receives explicit file-related rejection feedback with the ability to retry.

**Why this priority**: This is required alternative behavior in UC-05 and ensures file-quality rules are enforced before review intake.

**Related Use Cases**: UC-05 (extension 4b, steps 4b1-4b2)
**Related Acceptance Tests**: AT-UC05-03
**Architecture Layers Impacted**: presentation, business

**Independent Test**: Submit valid metadata with an invalid manuscript file and verify rejection, explicit file-requirement messaging, and ability to resubmit with a valid file.

**Acceptance Scenarios**:

1. **Given** an authenticated author submits valid metadata, **When** the manuscript file does not meet submission requirements, **Then** the system rejects the submission and reports the file issue explicitly.
2. **Given** a file validation rejection, **When** the author provides a corrected valid manuscript file and resubmits, **Then** the system revalidates and accepts only if all requirements are met.

### Edge Cases

- The author attempts submission when the paper submission window is closed.
- The author’s session expires between metadata entry and submission.
- The author uploads a manuscript file that exceeds allowed size limits.
- The author uploads a manuscript file with unsupported format.
- The author submits duplicate metadata values that violate submission uniqueness rules (for example, same title for same author within active cycle).
- The author retries submission rapidly after repeated validation failures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide authenticated authors with an option to submit a new paper manuscript.
- **FR-002**: The system MUST request all required manuscript metadata and the manuscript file before accepting a submission attempt.
- **FR-003**: The system MUST validate submitted metadata and manuscript file against defined submission requirements before persistence.
- **FR-004**: The system MUST accept and record the submission only when metadata and manuscript file are both valid.
- **FR-005**: The system MUST provide explicit confirmation to the author when a manuscript submission is accepted.
- **FR-006**: The system MUST reject submission attempts with missing or invalid required metadata and identify the metadata issues.
- **FR-007**: The system MUST reject submission attempts with invalid manuscript files and identify the file requirement violations.
- **FR-008**: The system MUST allow the author to correct rejected input and resubmit.
- **FR-009**: The system MUST make accepted submissions available to downstream referee assignment and review workflows.
- **FR-010**: The system MUST reject manuscript submission attempts from unauthenticated users or expired sessions with explicit user-visible authorization messaging.
- **FR-011**: The system MUST reject submission attempts when submission intake is closed and provide explicit status guidance to the author.
- **FR-012**: The system MUST validate submissions against a single authoritative required-metadata definition for the active submission cycle and apply that definition consistently to all authors in that cycle.
- **FR-012a**: For this feature, the required metadata fields MUST include manuscript title, abstract, keyword list, full author list, corresponding author contact email, and primary subject area.
- **FR-013**: The system MUST persist manuscript files in encrypted object storage and MUST store only file reference and integrity metadata in the manuscript submission record.
- **FR-014**: The system MUST accept only PDF manuscript files and MUST reject files larger than 20 MB with explicit file validation feedback.
- **FR-015**: The system MUST reject duplicate active submissions when the same author submits the same normalized manuscript title within the same conference cycle.
- **FR-016**: The system MUST normalize manuscript titles for duplicate checks using these rules in order: trim leading/trailing whitespace, collapse internal whitespace runs to a single space, apply Unicode NFKC normalization, convert to lowercase using Unicode default case folding (locale-independent), and remove punctuation characters.
- **FR-017**: For duplicate checks, an "active submission" MUST mean a submission in `SUBMITTED`, `UNDER_REVIEW`, or `REVISION_REQUESTED` status; submissions in `DRAFT`, `WITHDRAWN`, `REJECTED`, or `ARCHIVED` status MUST NOT be treated as active.

### Security & Privacy Requirements *(mandatory)*

- **SPR-001**: All manuscript submission data MUST be protected in transit using encrypted transport.
- **SPR-002**: Stored manuscript files and submission metadata containing sensitive content MUST be protected at rest.
- **SPR-003**: Manuscript files and sensitive metadata MUST NOT be exposed in plaintext in logs or error payloads.
- **SPR-004**: Submission actions MUST enforce author authentication and role-appropriate authorization.
- **SPR-005**: Validation and authorization failures MUST provide explicit user-visible messaging without exposing sensitive internal details.
- **SPR-006**: The system MUST write an audit log entry for each manuscript submission attempt outcome including timestamp, author identifier, submission identifier (if created), and failure reason code, and MUST exclude manuscript content and sensitive metadata from logs.

### Reliability & Availability Requirements *(mandatory)*

- **RAR-001**: Concurrent submission attempts MUST NOT corrupt manuscript or metadata state.
- **RAR-002**: Failed validation or operational failures MUST preserve prior persisted state and prevent partial submission records from being treated as accepted.
- **RAR-003**: Submission records and manuscript files created by this feature MUST be included in documented backup and restore procedures.
- **RAR-004**: Operational failures during submission MUST return explicit user-visible retry-capable guidance.
- **RAR-005**: The feature MUST provide deterministic outcomes for successful submission, metadata validation failure, file validation failure, and operational failure.
- **RAR-006**: For concurrent same-author submissions in the same cycle with the same normalized title, the system MUST enforce a deterministic single-winner outcome: at most one request may create or retain an active submission and all other concurrent requests MUST fail with an explicit duplicate-submission response.

### Architecture & Maintainability Requirements *(mandatory)*

- **AMR-001**: Feature behavior MUST preserve separation between presentation, business, and data responsibilities.
- **AMR-002**: Submission validation rules MUST be maintained in authoritative business logic.
- **AMR-003**: Feature requirements and scenarios MUST remain traceable to UC-05 and AT-UC05-01/02/03.
- **AMR-004**: User-visible submission messaging MUST remain consistent across all supported submission entry paths; for this feature scope, the supported entry path is the authenticated author manuscript submission flow.

### Assumptions

- Authors using this feature are registered users with valid login capability.
- The single authoritative metadata policy source for this feature is `CMS Manuscript Submission Policy v1.0`; any policy update requires versioned change control before taking effect for new cycles.
- Submission intake open/closed status is available to this feature at request time.

### Dependencies

- UC-05 remains the source of truth for core user-facing submission behavior.
- AT-UC05-01, AT-UC05-02, and AT-UC05-03 remain the source of truth for acceptance-level validation behavior.
- Downstream referee assignment and review workflows are available to consume accepted submissions.

### Key Entities *(include if feature involves data)*

- **Manuscript Submission**: The persisted submission record linking author identity, manuscript metadata, manuscript file reference, validation outcome, and submission status.
- **Submission Metadata Package**: The required author-provided metadata fields that describe and classify a manuscript for review intake; the required field set is fixed per active submission cycle, includes a normalized title value for duplicate checks, and follows `CMS Manuscript Submission Policy v1.0`.
- **Manuscript File Artifact**: The uploaded manuscript file evaluated against file requirements and stored in encrypted object storage, referenced by the submission record with integrity metadata.
- **Submission Intake Window**: The time-bounded policy state indicating whether new manuscript submissions are currently accepted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid manuscript submission attempts complete successfully and return explicit confirmation in acceptance validation.
- **SC-002**: 100% of submission attempts with missing or invalid required metadata are rejected with explicit metadata issue messaging.
- **SC-003**: 100% of submission attempts with invalid manuscript files are rejected with explicit file issue messaging.
- **SC-004**: 100% of accepted submissions are available to downstream referee assignment and review intake checks within the same validation run.
- **SC-005**: 100% of tested failure scenarios (metadata failure, file failure, authorization failure, operational failure) avoid partial accepted state and provide actionable user-visible guidance.
- **SC-006**: In concurrent duplicate-submission tests for the same author, cycle, and normalized title, exactly one request results in an active submission and 100% of other requests return explicit duplicate-submission feedback.
