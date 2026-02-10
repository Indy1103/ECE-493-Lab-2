# Quickstart — Generate Conference Schedule

## Purpose
Validate UC-14 behavior for schedule generation and the no-accepted-papers extension.

## Scenarios

1. **Generate schedule with accepted papers**
   - Precondition: At least one accepted paper exists.
   - Action: Administrator requests schedule generation.
   - Expected: Draft schedule is generated, ordered by submission time, and presented to administrator.

2. **No accepted papers**
   - Precondition: No accepted papers exist.
   - Action: Administrator requests schedule generation.
   - Expected: User-visible error stating schedule cannot be generated; no schedule created.

3. **Unauthorized access**
   - Precondition: Authenticated non-admin user.
   - Action: Request schedule generation or view.
   - Expected: Access denied with explicit, user-visible error.

4. **Concurrent requests**
   - Precondition: Multiple admin requests issued concurrently.
   - Action: Trigger schedule generation in parallel.
   - Expected: Consistent draft schedule with no conflicting outputs.
