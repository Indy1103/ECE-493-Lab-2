---
command: /speckit.validate-task-sequence
description: Validate that the task sequence in tasks.md contains no blocking or unresolved dependencies after checklist and remediation actions.
---

## Goal

Perform a **read-only validation** to confirm that `tasks.md`:

1. Contains **no blocking dependencies** that would prevent tasks from being executed in sequence
2. Has all prerequisite tasks either:
   - Completed earlier in the sequence, or
   - Explicitly noted as parallelizable or external
3. Does not assume unavailable artifacts, decisions, or outputs from tasks that occur later in the sequence

This validation checks **task sequencing and dependency logic only**. It does **not** evaluate task quality or implementation details.

---

## Operating Constraints

### STRICTLY READ-ONLY
- Do **not** modify `tasks.md`
- Do **not** reorder tasks
- Do **not** add or remove tasks
- Do **not** redesign the workflow

---

## Inputs

Load:
- `tasks.md`

No other artifacts are required for this validation.

---

## Validation Steps

### 1. Task Inventory

Extract from `tasks.md`:
- All task IDs
- Task descriptions
- Explicit dependency markers (e.g., “depends on”, “after”, “requires”, phase ordering)
- Parallel markers (if present)

---

### 2. Dependency Analysis

For each task, determine whether it:

- Depends on an artifact, decision, or output
- If so, check whether that dependency:
  - Appears earlier in the task sequence, OR
  - Is explicitly marked as parallel, external, or pre-existing

Flag as **blocking** if:
- A task requires an output that is only produced by a later task
- A task assumes completion of an undefined or missing prerequisite
- A task creates a circular dependency

---

### 3. Sequence Coherence Check

Analyze the overall sequence to confirm:
- No circular dependencies exist
- Foundational setup tasks precede dependent tasks
- Integration or validation tasks do not appear before their prerequisites

---

## Output Requirements (Natural Language Only)

Produce a concise, human-readable analysis with one of the following outcomes:

### PASS — No Blocking Dependencies
Use when:
- All tasks can be executed in sequence
- Dependencies are satisfied or explicitly non-blocking

### FAIL — Blocking Dependencies Detected
Use when:
- One or more tasks cannot proceed due to unresolved dependencies

For FAIL, describe:
- Which tasks are blocked
- What dependency is missing or out of order
- Why this prevents execution

Do **not** propose fixes or reordering.

---

## Example PASS Language

> PASS — The task sequence contains no blocking dependencies. All prerequisite work appears earlier in the sequence or is explicitly identified as parallel or external. The task flow is coherent and executable as written.

---

## STOP CONDITION

After producing the analysis, STOP. Do not perform remediation or suggest edits.
