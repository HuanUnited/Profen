# Block 1: The Core Graph & Hierarchy (Completed)

**Status**: Complete
**Date**: January 2, 2026
**Component**: Core Data Layer (Go + Ent + Postgres)

## 1. Overview

The foundation of Profen is the **Node Graph**, designed to handle recursive relationships (Subject → Topic → Theory) with high-performance read capabilities. We implemented a **Closure Table** pattern to ensure that retrieving a specific subtree (e.g., "All nodes under Math") is a single, fast SQL query, regardless of depth.[1]

## 2. Key Technical Decisions

**A. Logic Injection via Ent Hooks**
Instead of managing hierarchy logic in the Service Layer, we implemented it as an **Ent Runtime Hook** (`NodeClosureHook`).

* **Why**: This guarantees data integrity. Whether a node is created via the CLI, a Seed Script, or the GUI, the `node_closure` table is automatically updated. The Repository does not need to know *how* the hierarchy works, only *that* it works.[1]
* **Mechanism**: The hook intercepts `OpCreate` on `Node`. It inserts a self-reference (Depth 0) and copies all ancestor paths from the parent, incrementing the depth by 1.[1]

**B. Strict Association Typing**
We utilized a Go Enum (`RelType`) for the `node_associations` table. This prevents "stringly typed" errors and enforces specific relationship kinds (`tests`, `defines`, `prerequisite`) at the compiler level, rather than discovering typos at runtime.[2]

**C. Repository Pattern**
We abstracted the Ent client behind a `NodeRepository`. This allows the Application Layer to call semantic methods like `GetDescendants` instead of constructing complex ORM predicates repeatedly.[3]

## 3. Challenges & Resolutions

* **Issue: The "Silent Skip" Hook**

  * **Problem**: The hook was checking `m.Type() == node.Label`. Ent generated the label as `"node"` (lowercase), but the Mutation type was returning `"Node"` (uppercase). The hook failed silently, leaving the closure table empty.
  * **Fix**: Implemented `strings.EqualFold` for case-insensitive comparison to ensure robustness against Ent version changes or generation nuances.
* **Issue: Test Panics on Empty Results**

  * **Problem**: Using `assert` on a failed query result caused nil pointer dereferences when accessing fields like `path.Depth`.
  * **Fix**: Switched to `require.NoError` for database queries in tests. This halts the test immediately on DB error, providing clear logs instead of runtime panics.

## 4. Performance Validation

**Goal**: Retrieve all descendants of a 5-level hierarchy in < 10ms.

* **Benchmark Test**: `TestBlock1Performance`
* **Data Set**: 1 Subject → 5 Topics → 5 Theories ea. → 5 Problems ea. (~150+ nodes).
* **Result**: ⚡ **~1.5ms - 3ms** (well under the 10ms limit).
* **Conclusion**: The Closure Table strategy effectively front-loads the cost to the *Write* operation (which is rare) to optimize the *Read* operation (which is frequent).

## 5. Artifacts Created

| File                                    | Purpose                                              |
| :-------------------------------------- | :--------------------------------------------------- |
| `internal/data/schema/node.go`        | The central entity (Subject, Topic, Theory) [4].     |
| `internal/data/schema/nodeclosure.go` | The lookup table for fast ancestors/descendants [5]. |
| `internal/data/hooks/node_hooks.go`   | The logic engine that auto-fills the closure table.  |
| `internal/data/node_repository.go`    | The public API for the Application Layer.            |

---
