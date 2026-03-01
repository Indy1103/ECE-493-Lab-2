---
command: /speckit.validate-usecase-alignment
description: Validate that spec.md faithfully restates the active Use Case flows and functional intent, allowing additional requirements ONLY when explicitly justified by the project Constitution.
---

## Goal

Confirm that `/spec/{feature-name}/spec.md`:

1. Restates the **active Use Case** (primary, alternate, and exception flows) accurately and completely.
2. Contains **functional requirements congruent with the Use Case intent**.
3. Does **not** introduce unjustified new user-visible features.
4. **Explicitly allows additional requirements** when they are mandated or permitted by the **project Constitution** (e.g., security, reliability, error handling).

This validation is **read-only** and produces a **natural-language assessment only**.

---

## Critical Classification Rule (MANDATORY)

All requirements found in `spec.md` MUST be classified into exactly one of the following categories:

### 1. Use-Case-Mandated Behavior
- Behavior explicitly described in the active Use Case and/or Acceptance Test Suite.
- REQUIRED to appear in `spec.md`.

### 2. Constitution-Mandated Behavior (ALLOWED)
- Behavior **not described in the Use Case**, but required or permitted by the Constitution.
- Includes (but is not limited to):
  - Security constraints
  - Reliability and error-handling behavior
  - Observability, logging, auditability
  - Performance or safety constraints
- These **MUST NOT** be classified as new features.
- These **MUST NOT** cause validation failure.

### 3. Unjustified Additional Behavior (INVALID)
- Behavior that:
  - Is not in the Use Case or Test Suite, AND
  - Is not required or permitted by the Constitution
- This category **DOES cause failure**.

If behavior falls under category (2), the result MUST remain PASS.

---

## Authority Hierarchy (STRICT)

When evaluating necessity or permissibility, use the following order:

1. `.specify/memory/constitution.md`
2. `UseCases.md`
3. `TestSuite.md`

The Constitution is **authoritative permission** for constraints and operational behavior.

---

## Inputs

Load the following:

- `.specify/memory/constitution.md`
- `UseCases.md`
- `TestSuite.md`
- `spec.md`

No other artifacts may be used.

---

## Validation Steps

1. Identify the **active Use Case (UC-XX)** for the current feature.
2. Compare `spec.md` flows against the Use Case flows:
   - Main success flow
   - Alternate flows
   - Exception flows
3. Verify each functional requirement:
   - Congruent with UC intent, OR
   - Justified by the Constitution
4. Detect any behavior that is neither UC-mandated nor Constitution-mandated.

---

## Output (Natural Language Only)

Produce a concise, human-readable analysis with **one of the following outcomes**:

### PASS — Use Case Aligned
Use when:
- Spec faithfully restates UC flows
- No additional behavior exists beyond UC + Constitution

### PASS — Use Case Aligned with Constitution-Justified Additions
Use when:
- Spec restates UC flows
- Additional requirements exist
- Those requirements are justified by Constitution clauses
- No new user-visible features are introduced

### FAIL — Unjustified Additional Behavior Detected
Use only when:
- Spec introduces behavior
- That behavior is not required by the UC, Test Suite, or Constitution

---

## Output Requirements

- Output MUST be prose (no tables, no checklists).
- Explicitly state:
  - Whether the spec aligns with the Use Case
  - Whether additional behavior exists
  - Whether that behavior is Constitution-justified
- MUST NOT label Constitution-mandated behavior as a feature.
- MUST NOT recommend Use Case updates for Constitution-only constraints.

---

## Example Correct PASS Language

> PASS — The specification faithfully restates UC-01 for all primary and alternate flows.  
>  
> Additional requirements related to retrieval-failure handling and secure transport are present. These behaviors are not introduced as new user features but are required by the project Constitution to satisfy reliability and security constraints.  
>  
> The specification remains fully aligned with the Use Case, and no corrective action is required.

---

## STOP CONDITION

After producing the analysis, STOP. Do not perform remediation or edits.
