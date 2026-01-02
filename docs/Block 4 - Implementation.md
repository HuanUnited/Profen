# Block 4: The Suggestion Engine (Completed)

**Status**: ✅ Complete
**Date**: January 2, 2026
**Component**: Application Logic & Advanced Querying

## 1. Overview

The Suggestion Engine is the decision-making layer of Profen. It moves beyond simple "Spaced Repetition" by combining **Temporal Signals** (FSRS Due Dates) with **Structural Signals** (Knowledge Graph Gaps). We implemented the "Diagnostic Stream" which prioritizes problems that have blocked the user's progress on specific theories.

## 2. Key Technical Decisions

**A. The "Three Streams" Architecture**
We defined the repository to support three distinct query modes:

1. **Maintenance**: Standard FSRS retrieval (`GetDueCards`).
2. **Diagnostic**: Hierarchy-aware error retrieval (`GetDiagnosticGaps`).
3. **Mastery**: (Planned for future) Random access to mastered material.

**B. Custom SQL Modifiers in Ent**
Standard ORM predicates were insufficient for the "Error Gravity" sort logic.

* **Challenge**: We needed to sort Nodes by the *sum* of `weight_impact` of their related `error_resolutions`.
* **Solution**: Enabled the `sql/modifier` feature in Ent. This allowed us to inject raw SQL (`s.GroupBy`, `s.OrderBy(sql.Sum(...))`) directly into the builder pipeline while keeping the result type-safe (`[]*ent.Node`).

**C. Error Resolution Schema**

* Created the `error_resolutions` table to act as a "Todo List" for the engine.
* Fields: `weight_impact` (Float) allows us to differentiate between "Typos" (1.0) and "Conceptual Gaps" (5.0).
* State: `is_resolved` boolean allows users to clear errors from their queue without deleting the history.

## 3. Validation

* **Test**: `TestSuggestionEngine_DiagnosticGaps`
* **Scenario**:
  * Topic "Math" contains Problem A (Weight 1.0) and Problem B (Weight 5.0).
  * Problem C has no errors.
  * Problem B also has a *resolved* error (Weight 10.0).
* **Result**: The engine correctly:
    1. Ignored Problem C (No active errors).
    2. Ignored the resolved error on B.
    3. Returned `[B, A]`, proving the aggregate sort logic works.

## 4. Artifacts Created

| File | Purpose |
| :--- | :--- |
| `internal/data/schema/error_resolution.go` | The entity tracking user mistakes. |
| `internal/data/suggestion_repository.go` | The complex query logic (SQL modifiers). |
| `internal/data/suggestion_test.go` | Verification of the weighting algorithm. |

## 5. Updates

* **Dynamic Error Definitions**: Replaced hardcoded error types with a dynamic `error_definitions` table. This allows the system to scale to hundreds of error types (Syntax, Logic, Memory) without code changes.
* **Seeding**: Implemented a startup seeder that populates default error types (`ERR_LAPSE` - 1.0, `ERR_CONCEPT` - 2.5) to ensure the system works out-of-the-box.
* **Schema Integration**: Updated `ErrorResolution` to reference `error_definitions` via Foreign Key, ensuring data integrity. The Suggestion Engine query (`GetDiagnosticGaps`) relies on these resolutions to calculate priority.

### Block 7 Documentation (Partial / Data Ready)

Create `internal/data/docs/block_7_implementation.md`.
