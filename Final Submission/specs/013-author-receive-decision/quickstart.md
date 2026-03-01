# Quickstart: Author Receive Decision (UC-13)

## Goal

Notify authors when a final decision is available and allow them to view accept/reject outcomes.

## Preconditions

- Author is registered and logged in.
- Paper was submitted by the author.
- A final decision has been recorded for the paper.

## Happy Path (UC-13-S1)

1. System sends decision-available notification.
2. Author accesses decision in the CMS.
3. System presents accept/reject outcome.

## Notification Failure Path (UC-13-S2)

1. System attempts to send notification.
2. Notification fails; author is not notified.
3. Author remains unaware of the decision outcome.

## Acceptance Test Traceability

- UC-13-S1 → AT-UC13-01
- UC-13-S2 → AT-UC13-02
