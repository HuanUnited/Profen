# Block 3: Dictionary & Translation Logic (Completed)

**Status**: ✅ Complete
**Date**: January 2, 2026
**Component**: Domain Logic (Language Learning)

## 1. Overview

We implemented the specific logic required for vocabulary acquisition. Unlike standard flashcards, vocabulary requires **Dual-Directional Learning** (Recognition vs. Recall). We automated the creation of these pairs while respecting strict database constraints.

## 2. Key Technical Decisions

**A. Bi-Directional Node Creation**

* **Function**: `CreateTermPair(Native, Foreign)`
* **Behavior**: Creates two `Term` nodes atomically.
* **Automation**: Relies on the existing `FsrsCardInitHook` to automatically attach scheduling cards to *both* terms. This creates two distinct tracking timelines (e.g., user might know "Dog" -> "Sobaka" easily but fail "Sobaka" -> "Dog").

**B. Constraint-Aware Linking (ADR-001 Compliance)**

* **Challenge**: The `node_associations` table enforces `CHECK (source_id < target_id)`.
* **Solution**: The Repository logic automatically sorts the two node IDs before insertion.
  * If `Native < Foreign`: Inserts `Native -> Foreign` (Type: `translated_from`).
  * If `Foreign < Native`: Inserts `Foreign -> Native` (Type: `translation_of`).
* **Querying**: `GetTranslation` ignores this internal implementation detail and checks both directions, returning the connected partner regardless of how it was stored.

## 3. Validation

* **Test**: `TestDictionary_DualCreation`
* **Result**: Confirmed that one function call results in:
  * 2 Nodes (Term).
  * 2 FSRS Cards (New).
  * 1 Association (Translation).
  * Zero Constraint Violations.

## 4. Artifacts Created

| File | Purpose |
| :--- | :--- |
| `internal/data/dictionary_repository.go` | Logic for term pairs and translation lookup. |
| `internal/data/dictionary_test.go` | Verification of constraint handling. |
| `internal/data/schema/nodeassociation.go` | Added `translation_of` / `translated_from` enums. |
