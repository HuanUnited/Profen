# **Block 5.2: The Knowledge Library (Revised Implementation Plan)**

**Date**: January 3, 2026
**Status**: Planning Phase
**Goal**: Transform the Library from a generic file viewer into a structured, type-aware Knowledge Management System (KMS) with specialized views for Subjects, Topics, and Problems.

## **1. Backend Schema Changes (Critical)**

Before implementing the UI, the data layer must support specific titles and evolving metrics.

### **A. Node Table Migration**

We need to separate the concept of a "Name" from the "Content".

* **Action**: Add `title` (VARCHAR/String) column to the `nodes` table.
* **Migration**:
  * Default `title` to "Untitled Node".
  * Existing data migration script: Extract the first line of `body` (remove `#`) and save it to `title`.
  * Update `CreateNode` and `UpdateNode` Go methods to accept `title`.

### **B. Relationship Types Update**

Refine the `node_associations` enum to support the new logic:

* **Remove**: `example`, `prerequisite`
* **Add**:
  * `comes_before` (Source -> Target is a prereq)
  * `comes_after` (Source -> Target depends on)
  * `similar_to` (Undirected/Bidirectional similarity)
  * `tests` (Problem -> Theory)
  * `defines` (Theory -> Problem)
  * `variant_of` (Theory -> Theory)

### **C. Mastery & Difficulty Logic**

* **Mastery Calculation**: This will currently be a **runtime calculation** (computed on fetch) rather than stored state, to ensure it's always up-to-date.
  * *Leaf Mastery*: `count(attempts where correct) >= 3` AND `count(unresolved_errors) == 0`.
  * *Container Mastery*: Recursive average of children.

***

## **2. Frontend Architecture: The View Layer**

The `Library.tsx` monolith will be split into three specialized "View Engines" based on the selected node's type.

### **A. View 0: The Root Dashboard (Root View)**

* **Trigger**: No node selected (or explicit Root selection).
* **Layout**: Grid of **Subject Cards**.
* **Visuals**:
  * **Mastery Bar**: 0-100% progress based on child topics.
  * **Dynamic Styling**:
    * Standard: TUI Blue/Purple accents.
    * Mastered: "Mythical Red-Orange" border and glow.

### **B. View 1: The Container Interface (Subject / Topic)**

* **Trigger**: Node Type = `subject` or `topic`.
* **Header**: Title + Breadcrumbs (Context).
* **Layout**:
  * **Search Bar**: Local filtering by Title or Body context.
  * **Sub-Topic Grid**: Visual cards for direct children topics.
  * **Content Split**: Two distinct lists/columns below the grid:
    * **Theories**: List of theory nodes.
    * **Problems**: List of problem nodes.
* **Interactivity**: Single-click navigation to deeper nodes.

### **C. View 2: The Leaf Interface (Problem / Theory)**

* **Trigger**: Node Type = `problem` or `theory`.
* **Layout**:
  * **Header**: Title + Full Crumbs (`~Math/Algebra/Quadratics`).
  * **Main Content**: Markdown/LaTeX rendered description.
  * **Sidebar/Panel**:
    * **Attempt History**: Mini-bar graph of attempts + Average Time.
    * **Unresolved Errors**: List of linked active errors.
    * **Related Nodes**: Links derived from `node_associations` (e.g., "Tests Theory X").
  * **Action Bar**:
    * **"Attempt" Button**: Launches the Study Session modal for this specific node.
    * **"Edit" Button**: Opens the Unified Editor Modal.

***

## **3. Frontend Architecture: The Editor Layer**

We are abandoning the "In-Place" editor for a **Unified Modal Editor**.

### **The "Omni-Editor" Modal**

* **Trigger**: `Ctrl+E` (Edit), `Ctrl+N` (New), or UI Buttons.
* **State**: Handles both Create and Update operations.
* **Layout**:
    1. **Type Selector (Locked if Editing)**: Enum dropdown.
        * *Creation Logic*: If creating a nested node (e.g., Problem), forces selection of parent Subject/Topic first (Drill-down selector).
    2. **Core Fields**:
        * **Title** (Input): Plain text.
        * **Body** (CodeMirror): Markdown editor with live preview side-by-side (or toggle).
    3. **Connection Manager (The Graph Builder)**:
        * Dynamic rows for adding relationships.
        * **Input**: "Target Node Title" (Autocomplete).
        * **Type**: Dropdown filtered by current Node Type (e.g., Problems can only `test` Theories).
        * **Visuals**: List of active chips with 'X' to remove.

***

## **4. Implementation Roadmap (Sub-Blocks)**

1. **Backend Migration**:
    * Add `title` to DB.
    * Update Enums.
    * Update `GetNode` / `GetChildren` to return new fields.

2. **The "Omni-Editor" Component**:
    * Build the Modal UI.
    * Implement the "Drill-down" parent selector.
    * Implement the Connection Manager.

3. **The View Engines**:
    * Refactor `Library.tsx` to switch components based on type.
    * Build `RootView`, `ContainerView`, `LeafView`.

4. **Mastery & Search**:
    * Implement the client-side mastery logic (TanStack query selectors).
    * Implement the localized fuzzy search.
