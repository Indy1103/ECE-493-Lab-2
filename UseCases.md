
# Use Case UC-01: View Conference Announcements
**Goal in Context**: Enable a public user to access and read conference announcements without registering or logging in, in order to obtain basic conference information.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Public User  
**Secondary Actors**: None  
**Trigger**: The Public User accesses the CMS website.  

## Success End Condition
* The Public User has viewed the available conference announcements.  

## Failed End Condition
* The Public User leaves the system without obtaining any conference announcement information.  

## Preconditions
* The CMS is operational and accessible to public users.  

## Main Success Scenario
1. The Public User accesses the CMS website.
2. The system presents the publicly available conference announcements.
3. The Public User reads the conference announcements.

## Extensions
* **2a**: No conference announcements are available.
  * 2a1: The system indicates that no conference announcements are currently available.
  * 2a2: The use case continues at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Frequent  
* **Open Issues**: None  


# Use Case UC-02: Register User Account
**Goal in Context**: Allow a registered user to create a new account by providing personal information so that they can access CMS features.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Registered User  
**Secondary Actors**: None  
**Trigger**: The Registered User requests to register for an account.  

## Success End Condition
* The Registered User has a newly created account and is able to proceed to log in to the system.  

## Failed End Condition
* The Registered User does not obtain an account and cannot access CMS features.  

## Preconditions
* The CMS is operational and accessible.  

## Main Success Scenario
1. The Registered User requests the option to register a new account.
2. The system presents a registration form requesting the user’s personal information.
3. The Registered User provides the required information and submits the registration request.
4. The system validates the provided information.
5. The system creates the user account and makes it available for login.

## Extensions
* **4a**: The provided information is invalid or incomplete.
  * 4a1: The system informs the Registered User of the invalid or missing information.
  * 4a2: The use case resumes at step 3.
* **4b**: The provided email address is already registered.
  * 4b1: The system informs the Registered User that the email address is already in use.
  * 4b2: The use case resumes at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-03: Log In to System
**Goal in Context**: Allow a registered user to authenticate using valid credentials in order to access their role-specific home page.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Registered User  
**Secondary Actors**: None  
**Trigger**: The Registered User requests to log in to the CMS.  

## Success End Condition
* The Registered User is authenticated and has access to their role-specific home page.  

## Failed End Condition
* The Registered User is not authenticated and does not gain access to the system.  

## Preconditions
* The Registered User has an existing account in the CMS.  

## Main Success Scenario
1. The Registered User initiates a login request.
2. The system requests the Registered User’s username and password.
3. The Registered User provides their username and password.
4. The system verifies the provided credentials.
5. The system grants access and presents the Registered User’s role-specific home page.

## Extensions
* **4a**: The provided username or password is incorrect.
  * 4a1: The system informs the Registered User that the credentials are invalid.
  * 4a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Frequent  
* **Open Issues**: None  


# Use Case UC-04: Change Account Password
**Goal in Context**: Allow a registered user to change their existing password in order to maintain the security of their account.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Registered User  
**Secondary Actors**: None  
**Trigger**: The Registered User requests to change their account password.  

## Success End Condition
* The Registered User’s password has been changed, and the new password is in effect for future access.  

## Failed End Condition
* The Registered User’s password remains unchanged and account security is not updated.  

## Preconditions
* The Registered User is authenticated and has an active session in the CMS.  

## Main Success Scenario
1. The Registered User requests to change their password.
2. The system requests the necessary password information from the Registered User.
3. The Registered User provides the required password information.
4. The system validates the provided password information.
5. The system updates the password and confirms the change to the Registered User.

## Extensions
* **4a**: The provided password information is invalid or does not meet security requirements.
  * 4a1: The system informs the Registered User of the validation failure.
  * 4a2: The use case resumes at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-05: Submit Paper Manuscript
**Goal in Context**: Allow an author to submit a paper manuscript together with the required metadata so that it can enter the review process.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Author  
**Secondary Actors**: None  
**Trigger**: The Author requests to submit a new paper manuscript.  

## Success End Condition
* The paper manuscript and its metadata are successfully submitted and are available for referee assignment and review.  

## Failed End Condition
* The paper manuscript is not submitted and is not considered for the review process.  

## Preconditions
* The Author is registered and logged in to the CMS.  

## Main Success Scenario
1. The Author requests to submit a new paper manuscript.
2. The system requests the required manuscript metadata and paper file.
3. The Author provides the required metadata and submits the manuscript.
4. The system validates the provided information and manuscript file.
5. The system accepts the submission and confirms successful submission to the Author.

## Extensions
* **4a**: Required metadata is missing or invalid.
  * 4a1: The system informs the Author of the invalid or missing metadata.
  * 4a2: The use case resumes at step 3.
* **4b**: The manuscript file does not meet submission requirements.
  * 4b1: The system informs the Author that the manuscript file is invalid.
  * 4b2: The use case resumes at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-06: Save Paper Submission Draft
**Goal in Context**: Allow an author to save a partially completed paper submission so that it can be completed incrementally at a later time.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Author  
**Secondary Actors**: None  
**Trigger**: The Author requests to save the current state of a paper submission.  

## Success End Condition
* The current state of the paper submission is saved and can be accessed later by the Author.  

## Failed End Condition
* The paper submission state is not saved, and the Author cannot resume from the saved point.  

## Preconditions
* The Author is registered and logged in to the CMS.
* The Author has started a paper submission.  

## Main Success Scenario
1. The Author requests to save the current paper submission.
2. The system evaluates the provided submission information for validity.
3. The system saves the current state of the paper submission.
4. The system confirms to the Author that the submission has been saved.

## Extensions
* **2a**: The provided submission information violates submission rules.
  * 2a1: The system informs the Author of the validation issues.
  * 2a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-07: Assign Referees to Paper
**Goal in Context**: Allow an editor to assign referees to submitted papers so that each paper receives the required peer reviews.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Editor  
**Secondary Actors**: Referee  
**Trigger**: The Editor requests to assign referees to a submitted paper.  

## Success End Condition
* The selected referees are assigned to the paper and receive review invitations.  

## Failed End Condition
* Referees are not assigned to the paper and the review process does not proceed.  

## Preconditions
* The Editor is registered and logged in to the CMS.
* At least one paper has been submitted and is awaiting referee assignment.  

## Main Success Scenario
1. The Editor selects a submitted paper requiring referee assignment.
2. The system presents the option to assign referees to the selected paper.
3. The Editor provides referee identifiers for assignment.
4. The system validates the referee assignments.
5. The system assigns the referees to the paper and sends review invitations.

## Extensions
* **4a**: A selected referee exceeds the maximum allowed review workload.
  * 4a1: The system informs the Editor of the workload violation.
  * 4a2: The use case resumes at step 3.
* **4b**: The maximum number of referees for the paper has already been assigned.
  * 4b1: The system informs the Editor that no additional referees can be assigned.
  * 4b2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-08: Respond to Review Invitation
**Goal in Context**: Allow a referee to accept or reject a review invitation so that they can manage their review workload.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Referee  
**Secondary Actors**: None  
**Trigger**: The Referee receives a review invitation from the CMS.  

## Success End Condition
* The Referee’s response to the review invitation is recorded, and the appropriate next state is reached.  

## Failed End Condition
* The Referee’s response is not recorded, and the review invitation remains unresolved.  

## Preconditions
* The Referee is registered in the CMS.
* A review invitation has been issued to the Referee.  

## Main Success Scenario
1. The Referee accesses the review invitation.
2. The system presents the details of the review invitation.
3. The Referee chooses to accept or reject the review invitation.
4. The system records the Referee’s decision.
5. The system confirms that the Referee’s response has been recorded.

## Extensions
* **3a**: The Referee rejects the review invitation.
  * 3a1: The system records the rejection and marks the Referee as not assigned to the paper.
  * 3a2: The use case ends with the Success End Condition.
* **3b**: The Referee accepts the review invitation.
  * 3b1: The system records the acceptance and associates the paper with the Referee’s account.
  * 3b2: The use case ends with the Success End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-09: Access Assigned Paper for Review
**Goal in Context**: Allow a referee to access a paper and its associated review form after accepting a review invitation, so that they can perform the review.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Referee  
**Secondary Actors**: None  
**Trigger**: The Referee requests to access an assigned paper for review.  

## Success End Condition
* The Referee has access to the assigned paper and its review form.  

## Failed End Condition
* The Referee is unable to access the paper or review form.  

## Preconditions
* The Referee is registered and logged in to the CMS.
* The Referee has accepted a review invitation for the paper.  

## Main Success Scenario
1. The Referee requests to view their assigned papers.
2. The system presents the list of papers assigned to the Referee.
3. The Referee selects an assigned paper.
4. The system provides access to the selected paper and its review form.

## Extensions
* **2a**: The Referee has no assigned papers.
  * 2a1: The system informs the Referee that no papers are currently assigned.
  * 2a2: The use case terminates with the Failed End Condition.
* **3a**: The selected paper is no longer available for review.
  * 3a1: The system informs the Referee that the paper cannot be accessed.
  * 3a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-10: Submit Paper Review
**Goal in Context**: Allow a referee to submit a completed review form for an assigned paper so that the evaluation is considered in the editorial decision process.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Referee  
**Secondary Actors**: None  
**Trigger**: The Referee requests to submit a completed review for an assigned paper.  

## Success End Condition
* The Referee’s completed review is submitted and made available to the Editor for decision-making.  

## Failed End Condition
* The review is not submitted and is not considered in the paper evaluation process.  

## Preconditions
* The Referee is registered and logged in to the CMS.
* The Referee has accepted a review invitation and has access to the paper and review form.  

## Main Success Scenario
1. The Referee accesses the review form for an assigned paper.
2. The system presents the review form to the Referee.
3. The Referee completes the review form and submits it.
4. The system validates the submitted review information.
5. The system records the review and confirms successful submission to the Referee.

## Extensions
* **4a**: The submitted review form contains invalid or incomplete information.
  * 4a1: The system informs the Referee of the validation issues.
  * 4a2: The use case resumes at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-11: View Completed Paper Reviews
**Goal in Context**: Allow an editor to view all completed referee reviews for a paper so that an informed acceptance or rejection decision can be made.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Editor  
**Secondary Actors**: Referee  
**Trigger**: The Editor requests to view the completed reviews for a submitted paper.  

## Success End Condition
* The Editor has viewed all completed referee reviews for the selected paper.  

## Failed End Condition
* The Editor is unable to view the completed reviews and cannot proceed with an informed decision.  

## Preconditions
* The Editor is registered and logged in to the CMS.
* The paper has received completed reviews from referees.  

## Main Success Scenario
1. The Editor requests to view reviews for a submitted paper.
2. The system retrieves the completed reviews associated with the paper.
3. The system presents the completed reviews to the Editor.
4. The Editor reviews the referee evaluations.

## Extensions
* **2a**: Not all required referee reviews have been completed.
  * 2a1: The system informs the Editor that some reviews are still pending.
  * 2a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-12: Record Final Paper Decision
**Goal in Context**: Allow an editor to record a final acceptance or rejection decision for a paper so that the author is informed of the outcome.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Editor  
**Secondary Actors**: Author  
**Trigger**: The Editor requests to record a final decision for a reviewed paper.  

## Success End Condition
* The final decision for the paper is recorded, and the Author is informed of the acceptance or rejection.  

## Failed End Condition
* No final decision is recorded, and the Author is not informed of the paper outcome.  

## Preconditions
* The Editor is registered and logged in to the CMS.
* All required referee reviews for the paper have been completed.  

## Main Success Scenario
1. The Editor selects a paper that has completed referee reviews.
2. The system presents the completed reviews and decision options.
3. The Editor chooses a final acceptance or rejection decision.
4. The system records the Editor’s decision.
5. The system confirms that the decision has been recorded and notifies the Author.

## Extensions
* **1a**: The selected paper does not have all required completed reviews.
  * 1a1: The system informs the Editor that a final decision cannot be made yet.
  * 1a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-13: Receive Paper Decision
**Goal in Context**: Allow an author to receive the final acceptance or rejection decision for a submitted paper so that they know the outcome of the review process.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Author  
**Secondary Actors**: Editor  
**Trigger**: The system sends the final decision for a submitted paper.  

## Success End Condition
* The Author has received and is aware of the acceptance or rejection decision for their paper.  

## Failed End Condition
* The Author does not receive the decision and remains unaware of the paper’s outcome.  

## Preconditions
* The Author has submitted a paper through the CMS.
* A final decision has been recorded for the paper.  

## Main Success Scenario
1. The system notifies the Author that a decision is available for their submitted paper.
2. The Author accesses the decision information.
3. The system presents the acceptance or rejection decision to the Author.

## Extensions
* **1a**: The decision notification is not delivered to the Author.
  * 1a1: The Author does not receive the decision information.
  * 1a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  

# Use Case UC-14: Generate Conference Schedule
**Goal in Context**: Allow an administrator to generate a conference schedule for accepted papers so that conference sessions are organized.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Administrator  
**Secondary Actors**: None  
**Trigger**: The Administrator requests the generation of the conference schedule.  

## Success End Condition
* A conference schedule for accepted papers has been generated and is available for review and further use.  

## Failed End Condition
* No conference schedule is generated and conference sessions remain unorganized.  

## Preconditions
* There are accepted papers in the CMS.
* The Administrator is registered and logged in to the CMS.  

## Main Success Scenario
1. The Administrator requests the generation of the conference schedule.
2. The system generates a schedule for the accepted papers.
3. The system presents the generated schedule to the Administrator.

## Extensions
* **2a**: No accepted papers are available for scheduling.
  * 2a1: The system informs the Administrator that a schedule cannot be generated.
  * 2a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  

# Use Case UC-15: Edit Conference Schedule
**Goal in Context**: Allow an editor to modify an existing conference schedule so that it reflects the final conference arrangements.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Editor  
**Secondary Actors**: None  
**Trigger**: The Editor requests to edit the generated conference schedule.  

## Success End Condition
* The conference schedule has been updated and reflects the Editor’s final arrangements.  

## Failed End Condition
* The conference schedule remains unchanged and does not reflect the intended final arrangements.  

## Preconditions
* A conference schedule has already been generated.
* The Editor is registered and logged in to the CMS.  

## Main Success Scenario
1. The Editor requests to view the generated conference schedule.
2. The system presents the current conference schedule to the Editor.
3. The Editor requests modifications to the schedule.
4. The system updates the conference schedule based on the Editor’s changes.
5. The system confirms that the updated schedule is now the final version.

## Extensions
* **3a**: The requested schedule modifications are invalid.
  * 3a1: The system informs the Editor that the changes cannot be applied.
  * 3a2: The use case resumes at step 3.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-16: Receive Conference Schedule
**Goal in Context**: Allow an author of an accepted paper to receive the final conference schedule so that they know when and where to present.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Author  
**Secondary Actors**: Editor  
**Trigger**: The system publishes the final conference schedule.  

## Success End Condition
* The Author has received and is aware of the final conference schedule for their accepted paper.  

## Failed End Condition
* The Author does not receive the conference schedule and is unaware of their presentation details.  

## Preconditions
* The Author has at least one accepted paper.
* A final conference schedule has been created and published.  

## Main Success Scenario
1. The system notifies the Author that the final conference schedule is available.
2. The Author requests to view the conference schedule.
3. The system presents the conference schedule to the Author.

## Extensions
* **1a**: The conference schedule has not been finalized.
  * 1a1: The system informs the Author that the schedule is not yet available.
  * 1a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: High  
* **Frequency**: Occasional  
* **Open Issues**: None  

# Use Case UC-17: View Conference Registration Prices
**Goal in Context**: Allow an attendee to view the conference registration price list so that they can decide whether to attend the conference.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Attendee  
**Secondary Actors**: None  
**Trigger**: The Attendee requests to view conference registration information.  

## Success End Condition
* The Attendee has viewed the conference registration prices and understands the available attendance options.  

## Failed End Condition
* The Attendee is unable to view the registration prices and cannot make an informed attendance decision.  

## Preconditions
* The CMS is operational.  

## Main Success Scenario
1. The Attendee requests to view conference registration prices.
2. The system presents the published conference registration price list.
3. The Attendee reviews the registration prices.

## Extensions
* **2a**: The registration price list is not available.
  * 2a1: The system informs the Attendee that registration prices are currently unavailable.
  * 2a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: Medium  
* **Frequency**: Occasional  
* **Open Issues**: None  

# Use Case UC-18: Pay for Conference Attendance
**Goal in Context**: Allow an attendee to pay the required conference registration fee online so that their participation in the conference is secured.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Attendee  
**Secondary Actors**: None  
**Trigger**: The Attendee requests to register and pay for conference attendance.  

## Success End Condition
* The Attendee has successfully paid the registration fee and holds a valid conference attendance ticket.  

## Failed End Condition
* The Attendee has not completed payment and does not have a valid conference attendance ticket.  

## Preconditions
* The Attendee is registered and logged in to the CMS.
* Conference registration is open.  

## Main Success Scenario
1. The Attendee requests to register for the conference.
2. The system presents the available registration options and payment requirement.
3. The Attendee confirms the intent to pay for conference attendance.
4. The system processes the payment request.
5. The system confirms successful payment to the Attendee.

## Extensions
* **4a**: The payment is not successful.
  * 4a1: The system informs the Attendee that the payment has failed.
  * 4a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: Medium  
* **Frequency**: Occasional  
* **Open Issues**: None  


# Use Case UC-19: Receive Conference Registration Ticket
**Goal in Context**: Allow an attendee to receive a payment confirmation ticket after successful registration so that they can prove their conference attendance.  
**Scope**: Conference Management System (CMS)  
**Level**: User Goal  
**Primary Actor**: Attendee  
**Secondary Actors**: None  
**Trigger**: The system completes a successful conference registration payment.  

## Success End Condition
* The Attendee has received a valid registration ticket confirming conference attendance.  

## Failed End Condition
* The Attendee does not receive a registration ticket and cannot prove conference registration.  

## Preconditions
* The Attendee has successfully completed payment for conference attendance.  

## Main Success Scenario
1. The system confirms successful payment for conference attendance.
2. The system generates a registration confirmation ticket.
3. The system delivers the registration ticket to the Attendee.
4. The Attendee receives and retains the registration ticket.

## Extensions
* **3a**: The registration ticket cannot be delivered to the Attendee.
  * 3a1: The system informs the Attendee that the ticket could not be delivered.
  * 3a2: The use case terminates with the Failed End Condition.

## Related Information
* **Priority**: Medium  
* **Frequency**: Occasional  
* **Open Issues**: None  
