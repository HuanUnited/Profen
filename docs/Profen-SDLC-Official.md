# Profen: Software Development Lifecycle Document

**Project**: Profen – Adaptive Mastery Learning Application  
**Author**: [Your Name]  
**Date Started**: January 1, 2026 (18:00 UTC+7)  
**Status**: Planning Complete – Ready for Implementation  
**Version**: 1.0 (Final)

---

## Executive Summary

Profen is a local-first desktop application for mastery-based learning using the FSRS (Forgettable Spaced Repetition System) v6 algorithm combined with a diagnostic error-tracking engine. Unlike the predecessor Electron-based app, Profen prioritizes **architectural clarity, modularity, and algorithmic control**.

### Key Objectives

- Replace SQLite with PostgreSQL (pg_embed) for better query performance and relationship modeling
- Implement FSRS v6 scheduling + a parallel diagnostic suggestion engine
- Support bilingual learning (Russian ↔ English translations with separate cards)
- Eliminate "black box" problem: **achieve 100% transparency and control** over how suggestions work
- Build incrementally with 7 distinct work blocks, each with clear validation criteria
- Maintain full local-first operation with embedded PostgreSQL

### Success Criteria

- **Backend**: 80% unit test coverage per block
- **Data Integrity**: <10ms queries for 1,000–5,000 descendants
- **FSRS Validation**: Simulated retention matches predicted retention (1,000+ review benchmark)
- **Frontend**: Wails bindings generate without errors; 5 atomic base components support all UI composition

---

## Phase 1: Problem & Vision Clarity

### 1.1 Current State vs. Desired State

#### Current Limitations (Electron-Based Predecessor)

| Problem | Impact |
|---------|--------|
| Electron framework | Bulky binary, poor optimization control |
| Lack of modularity | Monolithic codebase makes features impossible to add |
| SQLite architecture | Cannot efficiently handle hierarchical queries (closure table operations) |
| Undocumented design | No understanding of how features work—can't debug or improve |
| No FSRS integration | Static spaced repetition, no diagnostic error tracking |

#### Desired State (Profen)

| Goal | Implementation |
|------|-----------------|
| **Performance** | PostgreSQL + Ent ORM for sub-10ms hierarchical queries |
| **Modularity** | Layered architecture (Presentation → Bridge → Application → Domain → Infrastructure) |
| **Algorithm Control** | Explicit FSRS v6 + separate diagnostic suggestion engine |
| **Transparency** | Comprehensive documentation, Architecture Decision Records, implementation notes |
| **Scalability** | Closure table design supports 1,000–5,000 learning nodes without degradation |

### 1.2 The Subject → Topic → Problem/Theory → Attempt → Error Model

This hierarchy is the **semantic foundation** of Profen:

```
Subject (Math)
  ↓
Topic (Calculus)
  ├─ Problem (Compute the derivative of sin(x))
  ├─ Problem (Compute the integral of cos(x))
  ├─ Theory (Definition of a limit)
  └─ Theory (Epsilon-delta proof)
      ├─ Attempt #1 (Failed → Conceptual Gap)
      ├─ Attempt #2 (Hard → Still confused)
      └─ Error Resolution (Revisit prerequisite)
```

#### Why This Matters

1. **Export-Friendly**: The hierarchy serializes cleanly to JSON for external analysis (LLM feedback, analytics)
2. **Business Logic**: Problems "test" theories; theories have prerequisites; errors point to weak theories
3. **Separation of Concerns**: FSRS operates only on Problems/Theories (leaf nodes with cards), not the hierarchy itself
4. **Diagnostic Power**: Error tracking is isolated from scheduling, enabling independent optimization

#### FSRS Integration

- **Scope**: Only Problems and Theories have `fsrs_cards` entries (not Subject or Topic)
- **Dual Cards**: For translation learning (e.g., Russian → English, English → Russian), two separate `fsrs_cards` entries exist on the same Theory node
- **Difficulty Evolution**: User-determined difficulty (`1–10`) updates iteratively based on attempt grades; does NOT come from FSRS weights
- **Error Weighting**: Unresolved errors in linked nodes increase suggestion priority **without modifying FSRS parameters**

### 1.3 Scope Boundaries

#### Out of Scope

| Excluded Feature | Rationale |
|---|---|
| Real-time collaboration | Focus: personal mastery learning, not team tools |
| Manual file versioning | Use `snapshot_json` in attempts table for historical understanding |
| Image hosting service | Store as Base64 or local paths in `metadata` JSONB |
| Plugin system | Out of scope for v1 (mention in future work) |
| Cross-device sync | Local-first desktop only; no cloud |

#### Incremental Build Strategy

> Build from **most independent** to **most dependent**.

- **Block 1** (Nodes + Closure Table) is the foundation
- **Block 2** (FSRS) depends on Block 1
- **Block 4** (Suggestion Engine) depends on Blocks 2 + 3
- **Block 5** (UI) depends on Blocks 1–4

**Result**: By project end, a **fully working product**, not an MVP.

---

## Phase 2: Architecture & Design

### 2.1 Data Model Overview

**Core Entities**:

- `nodes` – The universal container (Subject, Topic, Problem, Theory, Term)
- `node_closure` – Ancestor-descendant paths for hierarchical queries
- `node_associations` – Graph links (prerequisites, examples, translations)
- `fsrs_cards` – FSRS algorithm state (Stability, Difficulty, scheduled_days)
- `attempts` – User interaction log (grades, time, LLM snapshots)
- `error_resolutions` – Diagnostic state (which errors exist, resolved status, impact weight)
- `error_types` – Master table of error categories (system + user-defined)

### 2.2 Database Schema (Normalized)

#### Table: `nodes`

| Column | Type | Purpose |
|--------|------|---------|
| `node_id` | UUID (PK) | Unique identifier |
| `parent_id` | UUID (FK) | Adjacency list parent (NULL for roots) |
| `type` | ENUM | subject, topic, problem, theory, term |
| `body` | TEXT | Markdown + LaTeX content |
| `metadata` | JSONB | Images, code language, source URL |
| `created_at` | TIMESTAMP | Versioning |

#### Table: `node_closure`

| Column | Type | Purpose |
|--------|------|---------|
| `ancestor_id` | UUID (FK) | Path start (nodes.node_id) |
| `descendant_id` | UUID (FK) | Path end (nodes.node_id) |
| `depth` | INT | Distance (0 = self) |

**Unique Constraint**: (ancestor_id, descendant_id) prevents duplicate paths.

#### Table: `node_associations` (Directed Graph)

| Column | Type | Purpose |
|--------|------|---------|
| `source_id` | UUID (FK) | Starting node |
| `target_id` | UUID (FK) | Ending node |
| `rel_type` | ENUM | prerequisite, example, tests, similar_to, defines, translation, translated_from, variant_of |

**Constraint**: `CHECK (source_id < target_id)` prevents duplicate reverse edges (graph-theoretic integrity).

#### Table: `fsrs_cards`

| Column | Type | Purpose |
|--------|------|---------|
| `node_id` | UUID (PK, FK) | Reference to nodes (1:1) |
| `stability` | FLOAT | Days to 90% retention |
| `difficulty` | FLOAT | 1–10 user-perceived complexity |
| `last_review` | TIMESTAMP | Previous attempt timestamp |
| `elapsed_days` | INT | Days since penultimate review |
| `scheduled_days` | FLOAT | Next review interval (from FSRS) |
| `weights` | JSONB | User's memory weights (w0–w19) |

#### Table: `attempts`

| Column | Type | Purpose |
|--------|------|---------|
| `attempt_id` | UUID (PK) | Unique attempt ID |
| `node_id` | UUID (FK) | Which node was attempted |
| `grade` | INT | 1 (Again), 2 (Hard), 3 (Good), 4 (Easy) |
| `mode` | ENUM | retell, translate_to_target, translate_to_source, solve |
| `time_limit_seconds` | INT | From nodes.metadata |
| `actual_duration_seconds` | INT | Measured by backend |
| `is_timed_out` | BOOLEAN | User exceeded limit? |
| `snapshot_json` | JSONB | Raw user input + LLM feedback |
| `created_at` | DATE | For heatmap/analytics |

#### Table: `error_types`

| Column | Type | Purpose |
|--------|------|---------|
| `error_type_id` | UUID (PK) | Unique error category |
| `label` | TEXT | Human-readable name |
| `is_system` | BOOLEAN | System (immutable) or user-defined? |
| `base_weight` | FLOAT | Default suggestion priority |

#### Table: `error_resolutions`

| Column | Type | Purpose |
|--------|------|---------|
| `resolution_id` | UUID (PK) | Unique entry |
| `error_type_id` | UUID (FK) | Which error type? |
| `node_id` | UUID (FK) | Where did it occur? |
| `is_resolved` | BOOLEAN | Currently fixed? |
| `weight_impact` | FLOAT | Current priority in suggestion engine |

### 2.3 Canonical System Error Types

| Error Type ID | Label | Base Weight | Description |
|---|---|---|---|
| `ERR_LAPSE` | Memory Lapse | 1.0 | Forgot a known fact |
| `ERR_CONCEPT` | Conceptual Gap | 2.5 | Fundamental misunderstanding of theory |
| `ERR_EXECUTION` | Execution/Syntax | 1.2 | Logic correct, but typo or syntax error |
| `ERR_LANG_REC` | Recognition (Decoding) | 1.5 | Failed to translate Target → Source (RU → EN) |
| `ERR_LANG_PROD` | Production (Encoding) | 2.0 | Failed to translate Source → Target (EN → RU) |
| `ERR_FLUENCY` | Speed/Timing | 1.1 | Correct but exceeded time limit |

**Custom Errors**: Users can create new types with default `base_weight = 1.0`. Weights are user-adjustable in settings.

**Retroactivity Policy**: Changing a weight affects future suggestion ranking only (no historical recalculation). See ADR 002.

### 2.4 Key Relationships

```
nodes (1) ──┬──→ (N) nodes (self-ref parent/child)
            ├──→ (N) node_closure (paths)
            ├──→ (M/N) nodes via node_associations (graph)
            ├──→ (1:1) fsrs_cards (scheduling)
            └──→ (N) attempts (history)

attempts (1) ──→ (N) error_resolutions (diagnostics)

error_types (1) ──→ (N) error_resolutions (categorization)
```

### 2.5 The FSRS Engine

**Strategy**: Dual-library approach for scheduling vs. optimization.

#### Scheduling (Block 2/4): `go-fsrs` Library

- **Role**: Daily scheduling logic (calculating next Stability, Difficulty, Interval)
- **Input**: grade (1–4), current card state
- **Output**: new stability, difficulty, scheduled_days
- **Limitation**: Cannot optimize weights; only applies them

#### Optimization (Block 7): `fsrs-rs-c` via CGO

- **Role**: Background worker optimizes FSRS parameters every 1,000 reviews
- **Input**: Entire revlog (attempt history)
- **Output**: New weights (w0–w19)
- **Storage**: Saved in `fsrs_cards.weights` for new cards; retroactively invisible per ADR 002

### 2.6 The Suggestion Engine (Three Streams)

The Suggestion Engine runs **independently** of FSRS and operates a priority queue with three streams:

#### Stream 1: Maintenance (FSRS-Led)

```sql
SELECT n.node_id, fc.scheduled_days
FROM nodes n
JOIN fsrs_cards fc ON n.node_id = fc.node_id
WHERE fc.scheduled_days <= CURRENT_DATE
ORDER BY fc.stability ASC
LIMIT 10;
```

**Priority**: Problems/Theories due for scheduled review.

#### Stream 2: Diagnostic (Error-Led)

```sql
SELECT n.node_id, SUM(er.weight_impact) AS total_impact
FROM nodes n
JOIN error_resolutions er ON n.node_id = er.node_id
WHERE er.is_resolved = FALSE
GROUP BY n.node_id
ORDER BY total_impact DESC
LIMIT 10;
```

**Priority**: Nodes with unresolved errors (bypasses FSRS schedule).

#### Stream 3: Mastery (Fluency-Led)

```sql
SELECT n.node_id
FROM nodes n
JOIN fsrs_cards fc ON n.node_id = fc.node_id
JOIN node_mastery nm ON n.node_id = nm.node_id
WHERE nm.is_mastered = TRUE
  AND fc.last_review > INTERVAL '30 days'
ORDER BY fc.last_review ASC
LIMIT 10;
```

**Priority**: Keep mastered nodes "fresh" (prevent decay).

**Merge Logic**: Return up to 5 problems:

1. First priority: Unresolved errors (Stream 2)
2. Second: Overdue reviews (Stream 1)
3. Third: Mastery refreshers (Stream 3)

### 2.7 Problem-Linking Query (Block 4 Concrete Implementation)

After a user studies a Theory node, find linked Problems with unresolved errors:

```sql
-- Find problems linked to Theory :theory_id with unresolved errors, ranked by impact.
SELECT 
    n.node_id, 
    n.body,
    SUM(er.weight_impact) AS total_impact
FROM nodes n
JOIN node_associations na ON (
    (n.node_id = na.source_id AND na.target_id = :theory_id AND na.rel_type = 'tests')
    OR
    (n.node_id = na.target_id AND na.source_id = :theory_id AND na.rel_type = 'defines')
)
JOIN error_resolutions er ON n.node_id = er.node_id
WHERE er.is_resolved = FALSE
  AND n.type = 'problem'
GROUP BY n.node_id
ORDER BY total_impact DESC
LIMIT 5;
```

**Bidirectional Check**: Accounts for directionality via rel_type (see ADR 001).

### 2.8 UI/UX Workflows (7 Core Workflows)

#### Workflow 1: Create or Expand a Theory

**Inbound**: Markdown content, parent Topic ID, optional source URL  
**Process**:

1. Create `nodes` entry (type='theory')
2. Update `node_closure` with hierarchy path
3. Create `node_associations` for source links
4. Initialize `fsrs_cards` with default weights

**Outbound**: node_id, confirmation

#### Workflow 2: Dictionary Term Extraction

**Inbound**: Word, definition, origin node_id  
**Process**:

1. Create `nodes` entry (type='term')
2. Create `node_associations` (rel_type='defines')
3. If translation provided, create second term node + link
4. Initialize dual `fsrs_cards` (Recognition + Encoding)

**Outbound**: Highlighted term in source text

#### Workflow 3: Smart Attempt (The Learning Loop)

**Inbound**: User input, node_id, mode (retell/translate/solve)  
**Process**:

1. Log attempt with `snapshot_json`
2. Run FSRS update (via `go-fsrs`)
3. Penalize if `is_timed_out` (see Timing Specification)
4. Flag errors, update `error_resolutions`

**Outbound**: Next scheduled date, feedback

#### Workflow 4: Review Analytics & Mastery Tracking

**Inbound**: Scope filter (e.g., "Russian History" topic)  
**Process**:

1. Query `node_closure` for all descendants
2. Join with `fsrs_cards` for scheduling data
3. Join with `error_resolutions` for diagnostics
4. Calculate Fluency (avg Stability/Difficulty)

**Outbound**: Priority queue, mastery %, forgetting curve

#### Workflow 5: Create or Import a Problem

**Inbound**: Problem statement, reference theory, validation logic, difficulty seed  
**Process**:

1. Create `nodes` entry (type='problem')
2. Create `node_associations` (rel_type='tests' → Theory)
3. Initialize `fsrs_cards`

**Outbound**: Problem node, accessible in Theory's related problems

#### Workflow 6: Problem Solving Attempt (Active Recall)

**Inbound**: User solution, error type selection (if failed)  
**Process**:

1. Grade assignment (1–4)
2. FSRS update
3. Error logging → `error_resolutions`
4. Increase weight_impact on linked Theory nodes

**Outbound**: Feedback, updated mastery score

#### Workflow 7: Error Resolution (The "Gap" Closer)

**Inbound**: Filter: `is_resolved = FALSE`  
**Process**:

1. Suggestion Engine surfaces problems with unresolved errors
2. User re-solves
3. On success, toggle `is_resolved = TRUE`

**Outbound**: Updated diagnostic dashboard

---

## Phase 3: Technical Stack

### 3.1 Backend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Wails 2.x | Desktop app bridge |
| **Language** | Go 1.21+ | Type-safe, fast |
| **Database** | PostgreSQL (pg_embed) | Embedded relational DB |
| **ORM** | Ent | Graph-aware code generation |
| **FSRS Scheduling** | go-fsrs | Official Go port |
| **FSRS Optimization** | fsrs-rs-c (CGO) | Rust optimizer bridge |
| **HTTP** | Built-in Wails IPC | Frontend-backend communication |

### 3.2 Frontend Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18+ | UI library |
| **Language** | TypeScript 5+ | Type safety |
| **Styling** | Tailwind CSS | Utility-first design |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **State** | TanStack Query | Data fetching/caching |
| **Bindings** | Auto-generated by Wails | Go-to-TS struct mapping |

### 3.3 Local-First Architecture

- **PostgreSQL**: Embedded via `pg_embed` (no separate DB install)
- **Offline-First**: All data is local; no syncing
- **Backup**: User can export database as JSON (machine-readable)

---

## Phase 4: Code Organization & Modularity

### 4.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│ Presentation Layer (UI)                 │
│ React + TypeScript + Tailwind           │
└────────────────────┬────────────────────┘
                     ↓ (Wails IPC)
┌─────────────────────────────────────────┐
│ Bridge Layer (Wails Runtime)            │
│ Command Dispatcher, Route Binding       │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│ Application Layer (Use Cases)           │
│ Study Session, Dictionary, Analyzer     │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│ Domain Layer (Business Logic)           │
│ FSRS Algorithm, Node Hierarchy, Errors  │
└────────────────────┬────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│ Infrastructure Layer (Persistence)      │
│ PostgreSQL, Ent ORM, Migrations         │
└─────────────────────────────────────────┘
```

### 4.2 Directory Structure

```
/profen
├── cmd/
│   └── profen/
│       ├── main.go                    # Entry point
│       └── config.go                  # Config initialization
├── internal/
│   ├── app/                           # Application Layer
│   │   ├── study.go                   # Study session logic
│   │   ├── dictionary.go              # Term extraction
│   │   └── analyzer.go                # Suggestion engine
│   ├── domain/                        # Domain Layer
│   │   ├── fsrs/
│   │   │   ├── scheduler.go           # FSRS v6 scheduling
│   │   │   ├── optimizer.go           # Weight optimization (Block 7)
│   │   │   └── types.go               # Card, Attempt types
│   │   ├── node.go                    # Node interface
│   │   ├── error.go                   # Error weight logic
│   │   └── suggestion.go              # Three-stream merge
│   ├── data/                          # Infrastructure Layer
│   │   ├── postgres/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_init.sql       # Schema
│   │   │   │   ├── 002_fsrs_cards.sql
│   │   │   │   └── ...
│   │   │   ├── queries.go             # SQL helpers
│   │   │   └── pool.go                # Connection pooling
│   │   └── ent/
│   │       ├── generated/             # Auto-generated
│   │       └── schema/
│   │           ├── node.go
│   │           ├── fsrs_card.go
│   │           └── ...
│   └── platform/                      # Helpers
│       ├── logger.go
│       ├── llm/
│       │   └── ollama.go              # Local LLM integration
│       └── export.go                  # JSON export
├── frontend/                          # React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── atomic/
│   │   │   │   ├── Box.tsx
│   │   │   │   ├── MarkdownNode.tsx
│   │   │   │   ├── ActionTrigger.tsx
│   │   │   │   ├── TimerDisplay.tsx
│   │   │   │   └── GradeSelector.tsx
│   │   │   ├── smart/
│   │   │   │   ├── StudyController.tsx
│   │   │   │   ├── NodeEditor.tsx
│   │   │   │   └── DictionaryManager.tsx
│   │   │   └── layouts/
│   │   │       ├── Dashboard.tsx
│   │   │       └── StudySession.tsx
│   │   ├── hooks/
│   │   │   ├── useStudy.ts
│   │   │   ├── useNodes.ts
│   │   │   └── useAnalytics.ts
│   │   ├── wailsjs/
│   │   │   └── [Auto-generated by Wails]
│   │   └── App.tsx
│   └── package.json
├── build/                             # Platform assets
├── wails.json                         # Wails config
├── go.mod
└── README.md
```

---

## Phase 5: Implementation Strategy (7 Work Blocks)

### Block 1: The Core Graph (Go + PostgreSQL)

**Objective**: Establish the node hierarchy and closure table.

**Deliverables**:

- PostgreSQL schema (nodes, node_closure, node_associations)
- Ent ORM code generation
- Go functions:
  - `CreateNode(type, parent_id, body, metadata) → UUID`
  - `GetDescendants(ancestor_id) → []Node` (< 10ms for 1,000–5,000 nodes)
  - `CreateAssociation(source, target, rel_type) → error`
  - `ClosureTableInsert()` – trigger on node creation

**Validation**:

- Script creates 5-level hierarchy (5–10 nodes per level)
- Retrieves all 1,024 descendants in < 10ms (warm cache)
- Unit tests: 80% coverage

**Duration**: 1–2 weeks (depends on Ent learning curve)

---

### Block 2: The FSRS Engine (Math & Persistence)

**Objective**: Integrate FSRS v6 scheduling.

**Deliverables**:

- Integration with `go-fsrs`
- `fsrs_cards` table + Ent schema
- Go functions:
  - `InitializeCard(node_id, difficulty) → Card`
  - `UpdateCard(card, grade) → (newCard, error)`
  - `GetNextReview(card) → time.Time`

**Validation**:

- Unit test: Grade 1 (Again) → Stability halves, interval < 1 day
- Unit test: Grade 4 (Easy) → Stability increases, interval > 3 days
- Benchmark: 1,000 review simulation matches FSRS predicted retention

**Duration**: 1 week

---

### Block 3: The Translation Loop (Dictionary & Bilingual Logic)

**Objective**: Support dual-card system for language learning.

**Deliverables**:

- `term` node type
- Go functions:
  - `CreateTermNode(word, definition, language) → UUID`
  - `LinkTermToTheory(term_id, theory_id) → error`
  - `InitializeDualCards(term_id) → (card_ru→en, card_en→ru)`

**Validation**:

- Test: Create Russian term, verify two FSRS cards (Recognition + Production)
- Test: Link term to multiple theories

**Duration**: 5 days

---

### Block 4: The Suggestion Engine (Analytics & Priority Queue)

**Objective**: Implement three-stream priority queue.

**Deliverables**:

- Go functions:
  - `GetDueCards() → []Node` (FSRS-led)
  - `GetUnresolvedErrors() → []Node` (Diagnostic-led)
  - `GetMasteredButStale() → []Node` (Mastery-led)
  - `MergeSuggestions(s1, s2, s3) → []Node` (Priority: S2 > S1 > S3)

**Validation**:

- Test: Unresolved errors appear before due dates
- Test: Mastered nodes refresh after 30 days
- Benchmark: Suggestion query < 50ms for 5,000 nodes

**Duration**: 1–2 weeks

---

### Block 5: The Attempt Interface (Wails + React)

**Objective**: Build study UI (reading/solving) + grading.

**Deliverables**:

- **React Components**:
  - `StudyController.tsx` (Go-bound smart component)
  - `<TheoryAttemptCard>` (Theory + Timer + GradeSelector)
  - `<ProblemAttemptCard>` (Problem + Input + Timer + GradeSelector)
- **Go Functions**:
  - `StartAttempt(node_id) → StudySessionView` (returns node, time_limit, etc.)
  - `SubmitAttempt(node_id, grade, duration, snapshot) → (feedback, next_node)`

**Validation**:

- Test: Grade submission updates fsrs_cards
- Test: Timeout penalty applied (Grade capped at 2)
- UI test: Timer syncs with backend

**Duration**: 2–3 weeks

---

### Block 6: LLM Diagnostic Integration

**Objective**: Export snapshot_json for local LLM analysis.

**Deliverables**:

- Go function:
  - `ExportAttemptForLLM(attempt_id) → JSON` (returns context path, body, snapshot, errors)
- Frontend button: "Export for Analysis"
- Documentation: Prompt template for local Ollama

**Validation**:

- Test: Exported JSON is valid and parseable
- Manual test: Feed to local Ollama, verify feedback quality

**Duration**: 5–7 days

---

### Block 7: FSRS Optimizer (Background Worker)

**Objective**: Periodically optimize FSRS weights via fsrs-rs-c.

**Deliverables**:

- Background goroutine triggered every 1,000 attempts
- Go functions:
  - `OptimizeWeights() → ([]float32, error)` (calls fsrs-rs-c via CGO)
  - `SaveOptimizedWeights(weights) → error`
  - `ApplyNewWeights(weights) → nil` (for future cards)

**Validation**:

- Test: Optimizer runs without crashing
- Benchmark: Optimization time for 1,000 reviews < 5 seconds

**Duration**: 1–2 weeks (CGO setup is tricky)

---

## Phase 5: Definition of "Done"

A work block is **complete** when:

1. **Backend Code**: 80% unit test coverage
2. **Frontend Code**: Wails bindings generate without errors
3. **Data Integrity**: Every action creates an `attempts` log entry
4. **FSRS Validation**: Simulated retention matches predicted retention (benchmark: 1,000+ reviews)
5. **Documentation**: Implementation notes written in the block's `_implementation.md` file

---

## Phase 6: Architecture Decision Records (ADRs)

### ADR-001: Query Semantics & Association Direction

**Status**: Accepted  
**Date**: 2026-01-02

#### Context

The `node_associations` table has a `CHECK (source_id < target_id)` constraint to prevent duplicate links. However, relationships like "tests" or "prerequisite" are inherently directed. This creates potential ambiguity when querying.

#### Decision

We will maintain the `source_id < target_id` constraint for database integrity. To handle directionality, the `rel_type` ENUM will follow strict semantic naming:

- If a **Problem tests a Theory**, the association must be: `Problem(source) → tests → Theory(target)` **OR** `Theory(source) → defines → Problem(target)`
- Queries must check **both directions** based on the relationship type.

#### Rationale

1. **Prevents circular references**: Cannot accidentally create Problem → tests → Theory → tests → Problem loops
2. **Prevents duplicates**: Only one representation of each relationship (no "A tests B" and "B defines A" redundancy)
3. **Semantic clarity**: The `rel_type` encodes directionality; queries read both columns

#### Consequences

- Any query fetching related nodes must use:

  ```sql
  WHERE (source_id = :id AND rel_type = 'defines')
     OR (target_id = :id AND rel_type = 'tests')
  ```

- Frontend team must understand this bidirectionality when displaying "Related Content"
- Schema validation rules (e.g., "a Problem cannot test another Problem") must be enforced in application code

#### Mitigation

- Document this in `internal/data/postgres/relationships.md`
- Add query builder helper functions: `FindTestingProblems(theory_id)` and `FindTestedByProblems(theory_id)` to encapsulate complexity

---

### ADR-002: Error Weight Tuning Policy

**Status**: Accepted  
**Date**: 2026-01-02

#### Context

Users need to adjust how much weight different error types have in the suggestion engine. However, modifying historical FSRS data based on new preferences would corrupt the algorithm's predictive accuracy.

#### Decision

**Error weights affect the Suggestion Engine in real-time but have zero retroactive impact on `fsrs_cards` or previous attempts.**

When a user changes the `base_weight` of an error type:

1. The change applies immediately to future suggestion queries
2. Past attempts remain unchanged
3. Past `fsrs_cards` Stability/Difficulty remain unchanged
4. A "refresh" button lets users re-run the Suggestion Engine with new weights

#### Rationale

1. **FSRS Integrity**: FSRS is a mathematical model of memory. Retroactively changing grades based on new weight preferences breaks the model's assumptions.
2. **Separation of Concerns**: FSRS ≠ Suggestion Engine. FSRS predicts when to review; Suggestion Engine predicts *what* to review.
3. **User Transparency**: Users can see exactly which weights changed and when (via audit log)

#### Consequences

- Changing a weight does NOT retroactively adjust past mastery scores
- Users must manually revisit topics if they want to "undo" the effect of past weight choices
- The Suggestion Engine query must read the current `error_types.base_weight` at query time (not cached)

#### Mitigation

- Document this clearly in UI: "Adjusting error weights affects future suggestions but not past reviews"
- Add an audit log: `weight_change_history(error_type_id, old_weight, new_weight, changed_at)`

---

### ADR-003: Component-Binding Contract (Smart vs. Dumb)

**Status**: Accepted  
**Date**: 2026-01-02

#### Context

Wails auto-generates TypeScript from Go structs, creating one TypeScript type per Go struct. If every React component needs a Go struct, the codebase becomes littered with boilerplate bindings.

#### Decision

Only **Feature-Level (Smart) Components** will be bound to Go via Wails. All child components are **Pure React (Dumb)** and receive data as props.

**Smart Components** (Go-bound):

- `StudyController.tsx` → `study.go`
- `NodeEditor.tsx` → `node.go`
- `DictionaryManager.tsx` → `dictionary.go`
- `Analytics.tsx` → `analyzer.go`

**Dumb Components** (Pure React):

- `<GradeSelector>` (props: onGrade, disabled)
- `<Timer>` (props: limit, onTick)
- `<MarkdownRenderer>` (props: markdown)
- `<ErrorTag>` (props: label, weight)

#### Rationale

1. **Decoupling**: UI styling changes don't require Wails recompilation
2. **Reusability**: Dumb components can be tested in Storybook without backend
3. **Maintainability**: Fewer auto-generated bindings = easier to understand data flow
4. **Performance**: Fewer Wails IPC calls

#### Consequences

- Smart components must implement state management (e.g., TanStack Query) to fetch data from Go
- Event bubbling from Dumb → Smart components requires careful prop drilling (or context API)
- Wails bindings are larger (more data per IPC call) but fewer overall calls

#### Mitigation

- Create a `hooks/useBridge.ts` wrapper around Wails IPC to centralize backend calls
- Document component ownership: Smart components in `src/components/smart/`, Dumb in `src/components/atomic/`

---

## Phase 7: Documentation & Knowledge Capture

### 7.1 Required Documentation

Before each block begins:

| Document | Purpose | Owner |
|-----------|---------|-------|
| `block_N_implementation.md` | Implementation strategy, SQL schema, test plan | Dev |
| `api_contract.md` | Wails function signatures and return types | Dev + Frontend |
| `database_queries.md` | Reference implementations of complex queries | Dev |
| `component_hierarchy.md` | React component tree + data flow | Frontend |

After each block:

| Document | Purpose |
|-----------|---------|
| `IMPLEMENTATION_LOG.md` | What was built, what changed, why |
| `LESSONS_LEARNED.md` | What surprised you, what was hard |

### 7.2 Final Deliverables (Post-Implementation)

1. **Architecture Diagrams** (Mermaid or draw.io):
   - Data model (ER diagram)
   - Query flow (suggestion engine logic)
   - Component hierarchy (React tree)

2. **README.md**:
   - Setup instructions
   - Running tests
   - Building the binary

3. **SDLC_POSTMORTEM.md**:
   - Actual timeline vs. estimate
   - Blockers and how they were solved
   - Lessons for future projects

---

## Appendix A: Block 2 Timing Specification

### Context

Profen is a local-first Wails application where the UI can be paused (tab minimized), but the study session should continue tracking time on the backend for integrity.

### Specification: Timeout Penalty

**Goal**: Ensure fluency (speed) is prioritized without overriding memory lapses.

#### Timing Measurement (Hybrid)

1. **Client (React)**: Displays countdown timer for the user (visual feedback)
2. **Server (Go)**: Records `start_time` timestamp when attempt is served
3. **Validation**: On submission, Go compares `current_time - start_time` against `time_limit_seconds`
4. **Cheating Prevention**: Clock runs on Go backend, so pausing the browser tab doesn't stop the timer

#### Penalty Formula

```
IF is_timed_out = true:
    FSRS_Input_Grade = MIN(User_Selected_Grade, 2)
ELSE:
    FSRS_Input_Grade = User_Selected_Grade
```

#### Test Cases

| Scenario | User Grade | Timeout? | FSRS Grade | Interpretation |
|----------|-----------|---------|-----------|-----------------|
| Correct & fast | 4 | FALSE | 4 | Excellent |
| Correct & slow | 4 | TRUE | 2 (Hard) | Good answer, poor fluency → review sooner |
| Wrong & fast | 1 | FALSE | 1 | Memory failure → review tomorrow |
| Wrong & slow | 1 | TRUE | 1 | Not "upgraded" by timeout penalty |

#### Persistence

Both the user-selected grade and the FSRS-input grade must be saved in `attempts.snapshot_json`:

```json
{
  "user_grade": 4,
  "fsrs_grade": 2,
  "time_limit": 30,
  "actual_duration": 45,
  "timed_out": true,
  "feedback": "Correct answer but exceeded time limit. Review sooner to improve speed."
}
```

---

## Appendix B: Component Structure (Detailed)

### Atomic (Dumb) Components

```tsx
// Base layout primitive
<Box spacing="md" className="border" />

// Content renderer
<MarkdownNode markdown={theory.body} />

// Input & interaction
<ActionTrigger onClick={() => goBackend.Method()} label="Submit" />

// Timing
<TimerDisplay 
  limit={time_limit_seconds}
  elapsed={actual_duration_seconds}
  onTimeExpired={() => handleTimeout()}
/>

// Grading
<GradeSelector 
  options={[1, 2, 3, 4]}
  onSelect={(grade) => submitGrade(grade)}
  disabled={isSubmitting}
/>
```

### Smart (Go-Bound) Components

```tsx
// Study session orchestrator
<StudyController>
  <TheoryAttemptCard node={theory} onSubmit={handleSubmit} />
  <ProblemAttemptCard node={problem} onSubmit={handleSubmit} />
</StudyController>

// Node CRUD
<NodeEditor node={node} onSave={handleSave} />

// Term management
<DictionaryManager theory={theory} />

// Metrics dashboard
<Analytics topic={topic} />
```

### Composition Examples

```tsx
// Theory card = layout + content renderer
<TheoryCard>
  <Box>
    <MarkdownNode markdown={theory.body} />
  </Box>
</TheoryCard>

// Attempt card = card + timer + grade selector + input
<TheoryAttemptCard>
  <TheoryCard node={theory} />
  <TimerDisplay limit={time_limit} />
  <ActionTrigger label="Submit Attempt" onClick={submit} />
  <GradeSelector onSelect={grade} />
</TheoryAttemptCard>
```

---

## Appendix C: FSRS Default Weights (Reference)

These are the FSRS v6 default parameters used as the "seed" for all new cards:

| Parameter | Meaning | Default Value |
|-----------|---------|--------|
| w0 | Initial Difficulty | 5.0 |
| w1 | Min Difficulty | 1.0 |
| w2 | Max Difficulty | 10.0 |
| w3 | Initial Stability | 1.0 |
| w4 | Stability Increase (Easy) | 1.27 |
| w5 | Stability Increase (Good) | 1.00 |
| w6 | Stability Increase (Hard) | 0.60 |
| w7 | Stability Increase (Again) | 0.32 |
| w8 | Difficulty Increase (Again) | 0.61 |
| w9 | Difficulty Increase (Hard) | 0.18 |
| w10 | Difficulty Decrease (Good) | -0.10 |
| w11 | Difficulty Decrease (Easy) | -0.52 |
| w12–w19 | Interval multipliers | 1.0–2.0 (varies) |

**Source**: [FSRS-rs Documentation](https://github.com/open-spaced-repetition/fsrs-rs)

---

## Appendix D: Quick Reference (Command Checklists)

### Pre-Development Checklist

- [ ] PostgreSQL installed locally (or understand `pg_embed` setup)
- [ ] Go 1.21+ installed
- [ ] Node 18+ installed
- [ ] Wails CLI installed (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- [ ] Repository initialized with `wails create -n profen`
- [ ] Read Ent documentation: <https://entgo.io/docs>

### Block 1 Checklist

- [ ] PostgreSQL schema migrations written
- [ ] `node_closure` trigger implemented
- [ ] Ent schema generated
- [ ] `CreateNode()`, `GetDescendants()`, `CreateAssociation()` implemented
- [ ] Benchmark test passes: 5-level hierarchy, 1,000+ nodes, < 10ms query
- [ ] 80% unit test coverage
- [ ] Integration test: Create Subject → 10 Topics → 100 Problems → Query all descendants in < 10ms

### Pre-Block 5 Checklist

- [ ] Blocks 1–4 complete and tested
- [ ] Wails function signatures documented
- [ ] Data contracts defined (`StudySessionView`, `AttemptRequest`, etc.)
- [ ] Component structure approved
- [ ] TanStack Query setup complete

---

## Conclusion

This SDLC document represents **complete planning** with zero ambiguity. Every decision has been made, every trade-off justified, and every implementation path clarified.

You are **ready to code**.

The following sections should not require re-planning:

- ✅ Data model is locked
- ✅ API contracts are defined
- ✅ Implementation order is clear
- ✅ Success criteria are measurable
- ✅ Architecture decisions are recorded

**Start with Block 1. Build incrementally. Document as you go. Maintain control.**

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Next Review**: After Block 1 completion
