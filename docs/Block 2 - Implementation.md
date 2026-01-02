# Block 2: The FSRS Engine (Completed)

**Status**: ✅ Complete
**Date**: January 2, 2026
**Component**: Domain Logic & Persistence

## 1. Overview

We integrated the **FSRS v6 algorithm** into the core data model. Every "task-like" node (Problem, Theory, Term) now automatically possesses a 1:1 `FsrsCard` entity that tracks its memory state (Stability, Difficulty, Lapses).

## 2. Key Technical Decisions

**A. Auto-Initialization via Hooks**
We extended the Ent Hook pattern with `FsrsCardInitHook`.

* **Behavior**: When a Node is created, the hook intercepts the transaction and creates a corresponding `FsrsCard` with state `New` (Stability: 0, Due: Now).
* **Benefit**: The application layer never needs to remember to "create a card." It happens atomically with the Node.

**B. Service Layer Isolation**
We wrapped the `go-fsrs` library in a `FSRSService`.

* **Role**: Converts between our database entities (`ent.FsrsCard`) and the library's structs.
* **Logic**: Handles the state transition (New → Learning → Review) based on the user's grade (1–4).

**C. Database Schema**

* **Table**: `fsrs_cards`
* **Constraint**: Unique 1:1 Foreign Key to `nodes`.
* **Fields**: Stores raw FSRS parameters (`stability`, `difficulty`) alongside metrics (`reps`, `lapses`) to allow for future optimization (Block 7).

## 3. Validation

* **Test**: `TestReviewCard_Flow`
* **Result**: Confirmed that a "Good" rating:
    1. Increments `Reps`.
    2. Transitions state (New → Learning/Review).
    3. Pushes the `Due` date into the future.
    4. Persists all changes to Postgres.
