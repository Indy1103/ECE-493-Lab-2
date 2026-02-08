# Acceptance Test Suite — UC-01: View Conference Announcements

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-01**.

---

## AT-UC01-01
**Validated Scenario ID:** UC-01-S1  
**Description:** Verify that a public user can successfully view available conference announcements without registering.  

**Preconditions:**
- The CMS is operational and publicly accessible.
- At least one conference announcement exists in the system.

**Test Steps:**
1. A Public User accesses the CMS website without logging in.
2. The system presents the available conference announcements.
3. The Public User reads the displayed announcements.

**Expected Results:**
- Conference announcements are visible to the Public User.
- The Public User can read announcement content without registering or logging in.
- The Public User leaves the site having obtained conference information.

---

## AT-UC01-02
**Validated Scenario ID:** UC-01-S2  
**Description:** Verify system behavior when no conference announcements are available.  

**Preconditions:**
- The CMS is operational and publicly accessible.
- No conference announcements are available in the system.

**Test Steps:**
1. A Public User accesses the CMS website without logging in.
2. The system checks for available conference announcements.
3. The system indicates that no conference announcements are currently available.

**Expected Results:**
- The system clearly informs the Public User that no announcements are available.
- No conference announcement content is displayed.
- The Public User leaves the site without obtaining conference information.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-01-S1 → AT-UC01-01
  - UC-01-S2 → AT-UC01-02
- ✅ **All main and alternative flows of UC-01 are covered**
- ✅ **Only behavior described in the scenarios is tested**



# Acceptance Test Suite — UC-02: Register User Account

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-02**.

---

## AT-UC02-01
**Validated Scenario ID:** UC-02-S1  
**Description:** Verify that a new user can successfully register an account with valid information.  

**Preconditions:**
- The CMS is operational and accessible.
- The email address used for registration is not already registered in the system.

**Test Steps:**
1. A new user accesses the CMS website.
2. The user requests to register for an account.
3. The system presents a registration form requesting personal information.
4. The user enters all required information correctly and submits the form.
5. The system validates the submitted information.

**Expected Results:**
- The system creates a new user account.
- The system informs the user that the account has been successfully created.
- The user is able to proceed to log in to the CMS.

---

## AT-UC02-02
**Validated Scenario ID:** UC-02-S2  
**Description:** Verify system behavior when registration information is invalid or incomplete.  

**Preconditions:**
- The CMS is operational and accessible.

**Test Steps:**
1. A user accesses the CMS website.
2. The user requests to register for an account.
3. The system presents the registration form.
4. The user submits the form with missing or incorrectly formatted required information.
5. The system validates the submitted information.

**Expected Results:**
- The system detects invalid or incomplete registration information.
- The system informs the user that some information is missing or invalid.
- The user is able to correct the information and resubmit the registration request.

---

## AT-UC02-03
**Validated Scenario ID:** UC-02-S3  
**Description:** Verify system behavior when the provided email address is already registered.  

**Preconditions:**
- The CMS is operational and accessible.
- An existing account already uses the email address entered during registration.

**Test Steps:**
1. A user accesses the CMS website.
2. The user requests to register for an account.
3. The system presents the registration form.
4. The user submits the form using an email address that is already registered.
5. The system validates the submitted information.

**Expected Results:**
- The system detects that the email address is already in use.
- The system informs the user that the email address is already registered.
- The user is prompted to provide a different email address to continue registration.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-02-S1 → AT-UC02-01
  - UC-02-S2 → AT-UC02-02
  - UC-02-S3 → AT-UC02-03
- ✅ **All main and alternative flows of UC-02 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-03: Log In to System

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-03**.

---

## AT-UC03-01
**Validated Scenario ID:** UC-03-S1  
**Description:** Verify that a registered user can successfully log in with valid credentials and access their role-specific home page.  

**Preconditions:**
- The CMS is operational.
- A Registered User account exists with valid username and password credentials.

**Test Steps:**
1. A Registered User accesses the CMS login functionality.
2. The user enters a valid username and password.
3. The system verifies the provided credentials.

**Expected Results:**
- The system authenticates the Registered User.
- The Registered User is granted access to the system.
- The system presents the Registered User’s role-specific home page.

---

## AT-UC03-02
**Validated Scenario ID:** UC-03-S2  
**Description:** Verify system behavior when a registered user attempts to log in with incorrect credentials.  

**Preconditions:**
- The CMS is operational.
- A Registered User account exists.

**Test Steps:**
1. A Registered User accesses the CMS login functionality.
2. The user enters an incorrect username and/or password.
3. The system verifies the provided credentials.

**Expected Results:**
- The system detects that the credentials are invalid.
- The system informs the Registered User that the login attempt failed.
- The Registered User is not authenticated and does not gain access to the system.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-03-S1 → AT-UC03-01
  - UC-03-S2 → AT-UC03-02
- ✅ **All main and alternative flows of UC-03 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-04: Change Account Password

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-04**.

---

## AT-UC04-01
**Validated Scenario ID:** UC-04-S1  
**Description:** Verify that a registered user can successfully change their account password when valid information is provided.  

**Preconditions:**
- The CMS is operational.
- The Registered User has an existing account.
- The Registered User is authenticated and has an active session.

**Test Steps:**
1. The Registered User requests to change their account password.
2. The system requests the required password information.
3. The user provides valid password information.
4. The system validates the provided password information.

**Expected Results:**
- The system updates the user’s password.
- The system confirms that the password change was successful.
- The new password is required for future logins.

---

## AT-UC04-02
**Validated Scenario ID:** UC-04-S2  
**Description:** Verify system behavior when a user provides invalid password information during a password change request.  

**Preconditions:**
- The CMS is operational.
- The Registered User has an existing account.
- The Registered User is authenticated and has an active session.

**Test Steps:**
1. The Registered User requests to change their account password.
2. The system requests the required password information.
3. The user provides password information that does not meet security requirements.
4. The system validates the provided password information.

**Expected Results:**
- The system detects that the password information is invalid.
- The system informs the user that the password does not meet security requirements.
- The password is not changed, and the user is prompted to provide valid information.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-04-S1 → AT-UC04-01
  - UC-04-S2 → AT-UC04-02
- ✅ **All main and alternative flows of UC-04 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-05: Submit Paper Manuscript

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-05**.

---

## AT-UC05-01
**Validated Scenario ID:** UC-05-S1  
**Description:** Verify that an author can successfully submit a paper manuscript with valid metadata and a valid manuscript file.  

**Preconditions:**
- The CMS is operational.
- The Author has an existing account and is logged in.
- Paper submission is open.

**Test Steps:**
1. The Author requests to submit a new paper manuscript.
2. The system requests the required metadata and manuscript file.
3. The Author provides complete and valid metadata and a valid manuscript file.
4. The system validates the submitted information and file.

**Expected Results:**
- The system accepts the manuscript submission.
- The system confirms successful submission to the Author.
- The paper is available for referee assignment and review.

---

## AT-UC05-02
**Validated Scenario ID:** UC-05-S2  
**Description:** Verify system behavior when required manuscript metadata is missing or invalid during submission.  

**Preconditions:**
- The CMS is operational.
- The Author is logged in.
- Paper submission is open.

**Test Steps:**
1. The Author requests to submit a new paper manuscript.
2. The system requests the required metadata and manuscript file.
3. The Author submits the manuscript with missing or invalid metadata.
4. The system validates the submission.

**Expected Results:**
- The system detects missing or invalid metadata.
- The system informs the Author of the metadata issues.
- The manuscript is not submitted until valid metadata is provided.
- The Author is able to correct the metadata and resubmit.

---

## AT-UC05-03
**Validated Scenario ID:** UC-05-S3  
**Description:** Verify system behavior when the submitted manuscript file does not meet submission requirements.  

**Preconditions:**
- The CMS is operational.
- The Author is logged in.
- Paper submission is open.

**Test Steps:**
1. The Author requests to submit a new paper manuscript.
2. The system requests the required metadata and manuscript file.
3. The Author submits valid metadata with an invalid manuscript file.
4. The system validates the submission.

**Expected Results:**
- The system detects that the manuscript file is invalid.
- The system informs the Author that the file does not meet submission requirements.
- The manuscript is not submitted.
- The Author i

# Acceptance Test Suite — UC-06: Save Paper Submission Draft

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-06**.

---

## AT-UC06-01
**Validated Scenario ID:** UC-06-S1  
**Description:** Verify that an author can successfully save a partially completed paper submission draft.  

**Preconditions:**
- The CMS is operational.
- The Author has an existing account and is logged in.
- The Author has started a paper submission and entered some valid submission information.

**Test Steps:**
1. The Author requests to save the current state of the paper submission.
2. The system evaluates the provided submission information for validity.
3. The system saves the submission draft.
4. The system confirms that the submission has been saved.

**Expected Results:**
- The current state of the paper submission is saved.
- The system informs the Author that the draft has been successfully saved.
- The Author can later return to continue working on the submission.

---

## AT-UC06-02
**Validated Scenario ID:** UC-06-S2  
**Description:** Verify system behavior when a paper submission draft cannot be saved due to validation issues.  

**Preconditions:**
- The CMS is operational.
- The Author has an existing account and is logged in.
- The Author has started a paper submission.

**Test Steps:**
1. The Author requests to save the current state of the paper submission.
2. The system evaluates the provided submission information.
3. The system detects that some submission information violates submission rules.

**Expected Results:**
- The system does not save the submission draft.
- The system informs the Author of the validation issues.
- The Author cannot resume the submission from a saved draft.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-06-S1 → AT-UC06-01
  - UC-06-S2 → AT-UC06-02
- ✅ **All main and alternative flows of UC-06 are covered**
- ✅ **Only behavior described in the scenarios is tested**

# Acceptance Test Suite — UC-07: Assign Referees to Paper

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-07**.

---

## AT-UC07-01
**Validated Scenario ID:** UC-07-S1  
**Description:** Verify that an editor can successfully assign referees to a submitted paper when all constraints are satisfied.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- At least one paper is submitted and awaiting referee assignment.
- Selected referees have not exceeded their maximum review workload.
- The paper has not yet reached the maximum number of assigned referees.

**Test Steps:**
1. The Editor selects a submitted paper awaiting referee assignment.
2. The system presents the option to assign referees.
3. The Editor provides valid referee identifiers.
4. The system validates the referee assignments.

**Expected Results:**
- The referees are successfully assigned to the paper.
- Review invitations are sent to the assigned referees.
- The Editor is informed that the assignment was successful.
- The review process can proceed.

---

## AT-UC07-02
**Validated Scenario ID:** UC-07-S2  
**Description:** Verify system behavior when an editor attempts to assign a referee who has exceeded the maximum allowed workload.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper is awaiting referee assignment.
- At least one referee has already reached the maximum allowed review workload.

**Test Steps:**
1. The Editor selects a submitted paper awaiting referee assignment.
2. The system presents the option to assign referees.
3. The Editor selects a referee who has exceeded the workload limit.
4. The system validates the referee assignment.

**Expected Results:**
- The system detects the workload violation.
- The system informs the Editor that the selected referee cannot be assigned.
- No referee is assigned as a result of this attempt.
- The Editor is able to select a different referee.

---

## AT-UC07-03
**Validated Scenario ID:** UC-07-S3  
**Description:** Verify system behavior when an editor attempts to assign more referees than the allowed maximum for a paper.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper already has the maximum number of referees assigned.

**Test Steps:**
1. The Editor selects a paper that already has the maximum number of referees assigned.
2. The system presents the referee assignment option.
3. The Editor attempts to assign an additional referee.
4. The system validates the assignment request.

**Expected Results:**
- The system detects that the maximum number of referees has already been assigned.
- The system informs the Editor that no additional referees can be assigned.
- No new referees are added to the paper.
- The review assignment process does not proceed further for this paper.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-07-S1 → AT-UC07-01
  - UC-07-S2 → AT-UC07-02
  - UC-07-S3 → AT-UC07-03
- ✅ **All main and alternative flows of UC-07 are covered**
- ✅ **Only behavior described in the scenarios is tested**

# Acceptance Test Suite — UC-08: Respond to Review Invitation

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-08**.

---

## AT-UC08-01
**Validated Scenario ID:** UC-08-S1  
**Description:** Verify that a referee can successfully accept a review invitation.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered in the CMS.
- A review invitation has been issued to the Referee.

**Test Steps:**
1. The Referee accesses the review invitation.
2. The system presents the details of the invitation.
3. The Referee chooses to accept the review invitation.
4. The system records the Referee’s response.

**Expected Results:**
- The system records the acceptance of the review invitation.
- The paper is associated with the Referee’s account.
- The system confirms that the Referee’s response has been recorded.
- The Referee is now responsible for reviewing the paper.

---

## AT-UC08-02
**Validated Scenario ID:** UC-08-S2  
**Description:** Verify that a referee can successfully reject a review invitation.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered in the CMS.
- A review invitation has been issued to the Referee.

**Test Steps:**
1. The Referee accesses the review invitation.
2. The system presents the details of the invitation.
3. The Referee chooses to reject the review invitation.
4. The system records the Referee’s response.

**Expected Results:**
- The system records the rejection of the review invitation.
- The Referee is not assigned to the paper.
- The system confirms that the Referee’s response has been recorded.
- The review invitation is resolved.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-08-S1 → AT-UC08-01
  - UC-08-S2 → AT-UC08-02
- ✅ **All main and alternative flows of UC-08 are covered**
- ✅ **Only behavior described in the scenarios is tested**

# Acceptance Test Suite — UC-09: Access Assigned Paper for Review

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-09**.

---

## AT-UC09-01
**Validated Scenario ID:** UC-09-S1  
**Description:** Verify that a referee can successfully access an assigned paper and its review form after accepting a review invitation.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered and logged in.
- The Referee has accepted at least one review invitation.
- At least one assigned paper is available for review.

**Test Steps:**
1. The Referee requests to view assigned papers.
2. The system presents a list of papers assigned to the Referee.
3. The Referee selects one assigned paper.
4. The system provides access to the selected paper and its review form.

**Expected Results:**
- The list of assigned papers is displayed.
- The selected paper is accessible to the Referee.
- The associated review form is available.
- The Referee can proceed with the review.

---

## AT-UC09-02
**Validated Scenario ID:** UC-09-S2  
**Description:** Verify system behavior when a referee has no assigned papers.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered and logged in.
- The Referee has no papers assigned for review.

**Test Steps:**
1. The Referee requests to view assigned papers.
2. The system checks for assigned papers.

**Expected Results:**
- The system informs the Referee that no papers are currently assigned.
- No paper or review form is accessible.
- The Referee cannot proceed with any review activities.

---

## AT-UC09-03
**Validated Scenario ID:** UC-09-S3  
**Description:** Verify system behavior when an assigned paper is no longer available for review.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered and logged in.
- The Referee has accepted a review invitation.
- An assigned paper exists but is no longer available for review.

**Test Steps:**
1. The Referee requests to view assigned papers.
2. The system presents a list of assigned papers.
3. The Referee selects a paper from the list.
4. The system attempts to provide access to the selected paper.

**Expected Results:**
- The system informs the Referee that the selected paper cannot be accessed.
- The paper and review form are not made available.
- The Referee is unable to proceed with the review.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-09-S1 → AT-UC09-01
  - UC-09-S2 → AT-UC09-02
  - UC-09-S3 → AT-UC09-03
- ✅ **All main and alternative flows of UC-09 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-10: Submit Paper Review

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-10**.

---

## AT-UC10-01
**Validated Scenario ID:** UC-10-S1  
**Description:** Verify that a referee can successfully submit a completed review form for an assigned paper.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered and logged in.
- The Referee has accepted a review invitation.
- The Referee has access to the assigned paper and its review form.

**Test Steps:**
1. The Referee accesses the review form for an assigned paper.
2. The Referee completes all required review fields.
3. The Referee submits the completed review.
4. The system validates the submitted review information.

**Expected Results:**
- The system accepts the review submission.
- The review is recorded by the system.
- The system confirms successful submission to the Referee.
- The review is available to the Editor for decision-making.

---

## AT-UC10-02
**Validated Scenario ID:** UC-10-S2  
**Description:** Verify system behavior when a referee submits an incomplete or invalid review form.  

**Preconditions:**
- The CMS is operational.
- The Referee is registered and logged in.
- The Referee has accepted a review invitation.
- The Referee has access to the assigned paper and review form.

**Test Steps:**
1. The Referee accesses the review form for an assigned paper.
2. The Referee submits the review form with missing or invalid required information.
3. The system validates the submitted review.

**Expected Results:**
- The system detects missing or invalid review information.
- The system informs the Referee of the validation issues.
- The review is not recorded.
- The Referee is able to correct the review and resubmit it.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-10-S1 → AT-UC10-01
  - UC-10-S2 → AT-UC10-02
- ✅ **All main and alternative flows of UC-10 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-11: View Completed Paper Reviews

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-11**.

---

## AT-UC11-01
**Validated Scenario ID:** UC-11-S1  
**Description:** Verify that an editor can successfully view all completed referee reviews for a paper.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper exists.
- All required referee reviews for the paper have been completed.

**Test Steps:**
1. The Editor requests to view reviews for a submitted paper.
2. The system retrieves the completed referee reviews.
3. The system presents all completed reviews to the Editor.

**Expected Results:**
- All completed referee reviews for the selected paper are displayed.
- The Editor can read each referee’s evaluation.
- The Editor has sufficient information to make an informed acceptance or rejection decision.

---

## AT-UC11-02
**Validated Scenario ID:** UC-11-S2  
**Description:** Verify system behavior when an editor attempts to view reviews before all required referee reviews are completed.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper exists.
- At least one required referee review for the paper has not yet been completed.

**Test Steps:**
1. The Editor requests to view reviews for the submitted paper.
2. The system checks the review completion status.

**Expected Results:**
- The system detects that not all required reviews have been completed.
- The system informs the Editor that some reviews are still pending.
- The completed reviews are not presented in full.
- The Editor cannot proceed with an informed decision.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-11-S1 → AT-UC11-01
  - UC-11-S2 → AT-UC11-02
- ✅ **All main and alternative flows of UC-11 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-12: Record Final Paper Decision

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-12**.

---

## AT-UC12-01
**Validated Scenario ID:** UC-12-S1  
**Description:** Verify that an editor can successfully record a final acceptance decision for a paper after all reviews are completed.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper exists.
- All required referee reviews for the paper have been completed.

**Test Steps:**
1. The Editor selects a paper that has completed referee reviews.
2. The system presents the completed reviews and available decision options.
3. The Editor selects the acceptance decision.
4. The system records the decision.

**Expected Results:**
- The system records the Editor’s final decision.
- The system confirms that the decision has been saved.
- The Author is notified of the acceptance decision.
- The paper’s decision status is finalized.

---

## AT-UC12-02
**Validated Scenario ID:** UC-12-S2  
**Description:** Verify system behavior when an editor attempts to record a final decision before all referee reviews are completed.  

**Preconditions:**
- The CMS is operational.
- The Editor is registered and logged in.
- A submitted paper exists.
- At least one required referee review has not been completed.

**Test Steps:**
1. The Editor selects a submitted paper.
2. The Editor attempts to record a final decision.
3. The system checks the review completion status.

**Expected Results:**
- The system detects that not all required reviews are completed.
- The system informs the Editor that a final decision cannot be made yet.
- No decision is recorded.
- The Author is not notified.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-12-S1 → AT-UC12-01
  - UC-12-S2 → AT-UC12-02
- ✅ **All main and alternative flows of UC-12 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-13: Receive Paper Decision

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-13**.

---

## AT-UC13-01
**Validated Scenario ID:** UC-13-S1  
**Description:** Verify that an author successfully receives and views the final decision for a submitted paper.  

**Preconditions:**
- The CMS is operational.
- The Author has previously submitted a paper.
- A final acceptance or rejection decision has been recorded for the paper.

**Test Steps:**
1. The system issues a notification indicating that a decision is available for the Author’s paper.
2. The Author accesses the decision information through the CMS.
3. The system presents the final decision to the Author.

**Expected Results:**
- The Author is notified that a decision is available.
- The system displays the acceptance or rejection decision.
- The Author becomes aware of the outcome of the review process.

---

## AT-UC13-02
**Validated Scenario ID:** UC-13-S2  
**Description:** Verify system behavior when the decision notification is not delivered to the author.  

**Preconditions:**
- The CMS is operational.
- The Author has submitted a paper.
- A final decision has been recorded for the paper.
- The decision notification is not delivered to the Author.

**Test Steps:**
1. The system attempts to notify the Author that a decision is available.
2. The notification is not successfully delivered.
3. The Author does not access the decision information.

**Expected Results:**
- The Author does not receive any notification about the paper decision.
- The decision information is not accessed by the Author.
- The Author remains unaware of the paper’s acceptance or rejection.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-13-S1 → AT-UC13-01
  - UC-13-S2 → AT-UC13-02
- ✅ **All main and alternative flows of UC-13 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-14: Generate Conference Schedule

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-14**.

---

## AT-UC14-01
**Validated Scenario ID:** UC-14-S1  
**Description:** Verify that an administrator can successfully generate a conference schedule when accepted papers exist.  

**Preconditions:**
- The CMS is operational.
- The Administrator is registered and logged in.
- At least one paper has been accepted in the CMS.

**Test Steps:**
1. The Administrator requests generation of the conference schedule.
2. The system processes the request to generate a schedule.
3. The system presents the generated schedule to the Administrator.

**Expected Results:**
- A conference schedule is generated.
- The generated schedule includes all accepted papers.
- The schedule is presented to the Administrator.
- Conference sessions are organized and available for review or modification.

---

## AT-UC14-02
**Validated Scenario ID:** UC-14-S2  
**Description:** Verify system behavior when an administrator attempts to generate a schedule with no accepted papers.  

**Preconditions:**
- The CMS is operational.
- The Administrator is registered and logged in.
- No papers have been accepted in the CMS.

**Test Steps:**
1. The Administrator requests generation of the conference schedule.
2. The system checks for accepted papers.

**Expected Results:**
- The system detects that no accepted papers are available.
- The system informs the Administrator that a schedule cannot be generated.
- No conference schedule is created.
- Conference sessions remain unorganized.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-14-S1 → AT-UC14-01
  - UC-14-S2 → AT-UC14-02
- ✅ **All main and alternative flows of UC-14 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-15: Edit Conference Schedule

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-15**.

---

## AT-UC15-01
**Validated Scenario ID:** UC-15-S1  
**Description:** Verify that an editor can successfully update an existing conference schedule with valid modifications.  

**Preconditions:**
- The CMS is operational.
- A conference schedule has already been generated.
- The Editor is registered and logged in.

**Test Steps:**
1. The Editor requests to view the existing conference schedule.
2. The system presents the current conference schedule.
3. The Editor requests valid modifications to the schedule.
4. The system applies the requested changes.

**Expected Results:**
- The conference schedule is updated according to the Editor’s modifications.
- The system confirms that the updated schedule is now the final version.
- The updated schedule reflects the finalized conference arrangements.

---

## AT-UC15-02
**Validated Scenario ID:** UC-15-S2  
**Description:** Verify system behavior when an editor attempts to apply invalid modifications to the conference schedule.  

**Preconditions:**
- The CMS is operational.
- A conference schedule has already been generated.
- The Editor is registered and logged in.

**Test Steps:**
1. The Editor requests to view the existing conference schedule.
2. The system presents the current conference schedule.
3. The Editor requests schedule modifications that are invalid.
4. The system evaluates the requested modifications.

**Expected Results:**
- The system detects that the requested modifications are invalid.
- The system informs the Editor that the changes cannot be applied.
- The conference schedule remains unchanged.
- The Editor is able to revise and resubmit valid modifications.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-15-S1 → AT-UC15-01
  - UC-15-S2 → AT-UC15-02
- ✅ **All main and alternative flows of UC-15 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-16: Receive Conference Schedule

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-16**.

---

## AT-UC16-01
**Validated Scenario ID:** UC-16-S1  
**Description:** Verify that an author with an accepted paper can successfully receive and view the final conference schedule after it is published.  

**Preconditions:**
- The CMS is operational.
- The Author is registered and logged in.
- The Author has at least one accepted paper.
- The final conference schedule has been created and published.

**Test Steps:**
1. The system notifies the Author that the final conference schedule is available.
2. The Author requests to view the conference schedule.
3. The system presents the conference schedule to the Author.

**Expected Results:**
- The Author is notified that the final schedule is available.
- The conference schedule is displayed to the Author.
- The schedule includes the Author’s presentation details.
- The Author understands when and where their paper will be presented.

---

## AT-UC16-02
**Validated Scenario ID:** UC-16-S2  
**Description:** Verify system behavior when an author attempts to access the conference schedule before it is finalized.  

**Preconditions:**
- The CMS is operational.
- The Author is registered and logged in.
- The Author has at least one accepted paper.
- The conference schedule has not yet been finalized or published.

**Test Steps:**
1. The Author attempts to view the conference schedule.
2. The system checks the publication status of the schedule.

**Expected Results:**
- The system informs the Author that the conference schedule is not yet available.
- The conference schedule is not displayed.
- The Author remains unaware of presentation timing and location.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-16-S1 → AT-UC16-01
  - UC-16-S2 → AT-UC16-02
- ✅ **All main and alternative flows of UC-16 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-17: View Conference Registration Prices

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-17**.

---

## AT-UC17-01
**Validated Scenario ID:** UC-17-S1  
**Description:** Verify that an attendee can successfully view the published conference registration prices.  

**Preconditions:**
- The CMS is operational.
- A conference registration price list has been published in the CMS.

**Test Steps:**
1. The Attendee accesses the CMS.
2. The Attendee requests to view conference registration prices.
3. The system retrieves and presents the registration price list.

**Expected Results:**
- The registration price list is displayed to the Attendee.
- Different price options based on attendance type are visible.
- The Attendee can review and understand the available pricing options.

---

## AT-UC17-02
**Validated Scenario ID:** UC-17-S2  
**Description:** Verify system behavior when conference registration prices are unavailable.  

**Preconditions:**
- The CMS is operational.
- No registration price list is currently available in the CMS.

**Test Steps:**
1. The Attendee accesses the CMS.
2. The Attendee requests to view conference registration prices.
3. The system checks for an available price list.

**Expected Results:**
- The system informs the Attendee that registration prices are currently unavailable.
- No registration price information is displayed.
- The Attendee is unable to make an informed attendance decision based on pricing.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-17-S1 → AT-UC17-01
  - UC-17-S2 → AT-UC17-02
- ✅ **All main and alternative flows of UC-17 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-18: Pay for Conference Attendance

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-18**.

---

## AT-UC18-01
**Validated Scenario ID:** UC-18-S1  
**Description:** Verify that an attendee can successfully pay for conference attendance when payment is processed correctly.  

**Preconditions:**
- The CMS is operational.
- Conference registration is open.
- The Attendee is registered and logged in.
- Valid registration options and payment information are available.

**Test Steps:**
1. The Attendee requests to register for the conference.
2. The system presents registration options and payment requirements.
3. The Attendee confirms intent to pay.
4. The system processes the payment request.

**Expected Results:**
- The payment is processed successfully.
- The system confirms successful payment to the Attendee.
- The Attendee holds a valid conference attendance ticket.
- The Attendee’s participation in the conference is secured.

---

## AT-UC18-02
**Validated Scenario ID:** UC-18-S2  
**Description:** Verify system behavior when payment for conference attendance fails.  

**Preconditions:**
- The CMS is operational.
- Conference registration is open.
- The Attendee is registered and logged in.

**Test Steps:**
1. The Attendee requests to register for the conference.
2. The system presents registration options and payment requirements.
3. The Attendee confirms intent to pay.
4. The system attempts to process the payment.

**Expected Results:**
- The system detects that the payment is not successful.
- The system informs the Attendee that the payment has failed.
- No valid conference attendance ticket is issued.
- The Attendee’s participation is not secured.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-18-S1 → AT-UC18-01
  - UC-18-S2 → AT-UC18-02
- ✅ **All main and alternative flows of UC-18 are covered**
- ✅ **Only behavior described in the scenarios is tested**


# Acceptance Test Suite — UC-19: Receive Conference Registration Ticket

This acceptance test suite validates all user-visible behavior described in the scenarios for **UC-19**.

---

## AT-UC19-01
**Validated Scenario ID:** UC-19-S1  
**Description:** Verify that an attendee successfully receives a registration ticket after completing conference payment.  

**Preconditions:**
- The CMS is operational.
- The Attendee is registered in the CMS.
- The Attendee has successfully completed payment for conference attendance.

**Test Steps:**
1. The system confirms successful payment for conference attendance.
2. The system generates a registration confirmation ticket.
3. The system delivers the registration ticket to the Attendee.

**Expected Results:**
- A registration confirmation ticket is generated.
- The Attendee receives the registration ticket.
- The ticket can be retained as proof of conference registration.
- The Attendee is aware that their conference attendance is confirmed.

---

## AT-UC19-02
**Validated Scenario ID:** UC-19-S2  
**Description:** Verify system behavior when the registration ticket cannot be delivered after successful payment.  

**Preconditions:**
- The CMS is operational.
- The Attendee is registered in the CMS.
- The Attendee has successfully completed payment for conference attendance.
- A condition exists that prevents ticket delivery.

**Test Steps:**
1. The system confirms successful payment for conference attendance.
2. The system generates a registration confirmation ticket.
3. The system attempts to deliver the ticket.
4. The delivery attempt fails.

**Expected Results:**
- The registration ticket is not delivered to the Attendee.
- The system informs the Attendee that the ticket could not be delivered.
- The Attendee does not receive proof of registration.

---

## Coverage Confirmation

- ✅ **Every scenario has at least one corresponding acceptance test case**:
  - UC-19-S1 → AT-UC19-01
  - UC-19-S2 → AT-UC19-02
- ✅ **All main and alternative flows of UC-19 are covered**
- ✅ **Only behavior described in the scenarios is tested**
