---
command: /speckit.validate-architecture-and-models
description: Validate that architecture, data models, and interfaces align with the Constitution and specification. Optionally aggregate data models into a unified ER diagram when all branches are complete.
---

## Goal

Perform a **read-only validation** after checklist completion to confirm that:

1. Architectural decisions and the tech stack in `plan.md` align with the **intent and constraints defined in the Constitution**
2. `data-model.md` and interfaces in `./contracts/` are **congruent with the functional requirements in `spec.md`**
3. When **all feature branches are complete**, all `data-model.md` files can be logically combined into a **single entity–relationship (ER) diagram** without contradiction

This command performs **analysis only** and produces **natural-language output**.

---

## Operating Constraints

### STRICTLY READ-ONLY
- Do **not** modify any files
- Do **not** redesign architecture
- Do **not** rewrite data models or interfaces
- Do **not** generate diagrams (describe feasibility only)

### Authority Hierarchy (MANDATORY)

1. `.specify/memory/constitution.md` — defines architectural intent and constraints
2. `spec.md` — defines functional requirements
3. `plan.md` — proposes architecture and tech stack
4. `dat-model.md` and `./contracts/*` — concrete structural representations

---

## Inputs

Load:
- `.specify/memory/constitution.md`
- `spec.md`
- `plan.md`
- `data-model.md`
- All files in `./contracts/`

When performing the **cross-branch check**, load all `specs/*/data_model.md`.

---

## Validation Steps

### 1. Architecture vs Constitution Validation

Analyze `plan.md` and determine whether:

- Chosen architecture style aligns with Constitution principles
- Tech stack choices respect stated constraints (e.g., security, reliability, scalability, simplicity)
- No architectural decisions contradict explicit Constitution mandates

Classification:
- **Aligned**
- **Aligned with Constitution-Justified Tradeoffs**
- **Misaligned (Violation of Constitution Intent)**

---

### 2. Data Model Congruence with Specification

Analyze `data_model.md` and verify that:

- All entities correspond to concepts required by `spec.md`
- No entity introduces **new functional behavior** beyond the specification
- Attributes and relationships support the functional requirements
- Terminology is consistent with the spec

Report:
- Missing required entities
- Extra entities not justified by the spec
- Ambiguous or mismatched relationships

---

### 3. Interface Congruence with Specification

Analyze `./contracts/` and verify that:

- Interfaces expose only operations required by `spec.md`
- Inputs/outputs align with defined functional requirements
- No interface enables functionality not described or justified

---

### 4. Cross-Branch Data Model Aggregation (CONDITIONAL)

This step runs **only if all feature branches are complete**.

Determine whether:
- All `data-model.md` files can be merged into a single ER model
- Entity names, keys, and relationships are compatible
- Conflicts (naming, cardinality, ownership) exist

Produce:
- A **natural-language description** of the unified ER diagram
- A list of conflicts preventing clean aggregation (if any)

Do **NOT** generate a diagram file.

---

## Output Requirements (Natural Language Only)

Produce **four short sections**:

### Architecture Alignment Summary
- Whether plan.md matches Constitution intent
- Any constitution-justified deviations

### Data Model Alignment Summary
- Whether data_model.md supports spec.md fully
- Any missing or extra entities

### Interface Alignment Summary
- Whether contracts align with spec.md
- Any overexposed or missing operations

### Cross-Branch ER Feasibility Summary (if applicable)
- Whether a unified ER diagram is feasible
- Key merge assumptions or blockers

---

## Outcome Classification

End with **one of the following**:

- **PASS** — Architecture, models, and interfaces are aligned
- **PASS with Notes** — Aligned, with constitution-justified tradeoffs
- **FAIL** — Misalignment detected that must be resolved before proceeding

---

## STOP CONDITION

After producing the analysis, STOP.  
Do not suggest edits or generate artifacts.

