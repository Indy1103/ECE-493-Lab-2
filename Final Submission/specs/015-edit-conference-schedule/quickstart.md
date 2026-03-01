# Quickstart — Edit Conference Schedule

## Purpose
Validate UC-15 behavior for editing and finalizing schedules, including invalid modification handling.

## Scenarios

1. **Valid schedule edits**
   - Precondition: A generated schedule exists.
   - Action: Editor submits valid modifications.
   - Expected: Schedule updates and is marked final.

2. **Invalid schedule edits**
   - Precondition: A generated schedule exists.
   - Action: Editor submits invalid modifications.
   - Expected: Explicit error; schedule unchanged; editor can resubmit.

3. **Unauthorized edit attempt**
   - Precondition: Authenticated non-editor user.
   - Action: Attempt to edit schedule.
   - Expected: Access denied with explicit error.
