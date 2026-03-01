# Quickstart — Author Schedule Access

## Purpose
Validate UC-16 behavior for author notification and schedule access, including unpublished schedule handling.

## Scenarios

1. **Published schedule access**
   - Precondition: Final schedule is published; author has an accepted paper.
   - Action: Author receives notification and requests schedule.
   - Expected: Schedule is displayed with author presentation details.

2. **Unpublished schedule access**
   - Precondition: Schedule is not finalized or published; author has an accepted paper.
   - Action: Author requests schedule.
   - Expected: System informs author that the schedule is not yet available.

3. **Unauthorized access**
   - Precondition: User is not authenticated as an author.
   - Action: User requests schedule.
   - Expected: Access denied with explicit error.
