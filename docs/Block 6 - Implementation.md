# Block 6: LLM Integration (Logic Layer)

**Status**: ✅ Complete (Backend)
**Date**: January 2, 2026
**Component**: AI Context Bridge

## 1. Overview

Block 6 implemented the mechanism to "Export Context" for the AI. Instead of sending a raw problem statement to the LLM, we aggregate the **Ancestry** (Topic Hierarchy), **Related Theory** (Prerequisites), and **Active Diagnostic Errors**. This ensures the AI tutor has full visibility into *why* the user is stuck.

## 2. Key Technical Decisions

**A. The Snapshot Struct**

* Designed a JSON-ready struct `NodeSnapshot` containing:
  * `TargetNode`: The problem being solved.
  * `AncestryPath`: Full path (e.g., "Math" -> "Algebra").
  * `RelatedTheory`: The "Textbook" content linked to the problem.
  * `ActiveErrors`: Specific gaps (e.g., "Concept Error") previously flagged.

**B. Robust Graph Querying**

* **Ancestry**: Uses the Closure Table (`QueryAncestor`) to fetch the full path in a single query.
* **Theory Link**: Implemented a bidirectional check (`HasIncoming` OR `HasOutgoing`) for the `tests` relationship, ensuring resilience against graph directionality variances.
* **Diagnostics**: Aggregates unresolved errors from `ErrorResolution` and resolves their labels via `ErrorDefinition` (N+1 query acceptable for single-item export).

## 3. Validation

* **Test**: `TestExportSnapshot`
* **Result**: Validated that for a given Problem:
  * Ancestry path is correctly reconstructed.
  * Linked Theory is found and included.
  * Resulting struct matches the JSON spec for Ollama.

## 4. Artifacts Created

| File | Purpose |
| :--- | :--- |
| `internal/app/service/snapshot.go` | The logic to gather and format the context. |
| `internal/app/service/snapshot_test.go` | Integration test verifying graph traversals. |
