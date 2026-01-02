# **Block 5: Frontend Architecture & TUI Implementation**

**Status**: 🚧 In Progress
**Date**: January 2, 2026
**Theme**: "The Terminal Learning Environment"

## 1. The Pivot: Why & What?

We have paused the original "React Monolith" approach to focus on a **Creator-First Workflow**. The previous dashboard failed because there was no way to create data. The new architecture prioritizes the **Library (Editor)** and **Study Session (Consumer)** as distinct modes.

**Core Philosophy:**

* **Aesthetic**: "WebTUI" (Terminal User Interface via CSS). Minimalist, high-contrast, keyboard-centric.
* **Structure**: Obsidian-like "Split Brain" (Editor vs. Studier).
* **Data Flow**: Local-First, Offline-Capable (TanStack Query + Wails).

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Styling** | **WebTUI** (`@webtui/css`) | The core "Retro Terminal" look. |
| **Layout** | **React Router v6** | Client-side routing for distinct Views. |
| **Editor** | **CodeMirror 6** | Lightweight Markdown/LaTeX editing with Vim mode support. |
| **Math** | `remark-math` + `rehype-katex` | Rendering equations in problems/theories. |
| **State** | **TanStack Query** | Caching Wails responses (no global Redux store). |
| **Icons** | **Lucide React** | Clean vector icons that match the TUI vibe. |

## 3. Database Schema Updates (Prerequisites)

To support the new "Study Session" features, the backend requires these fields:

* **`Attempt` Table**: Added `user_answer` (Text/JSON) to store exactly what the user typed during a review.
* **`ErrorResolution` Table**: Added `resolution_notes` (Text) to log *how* the user fixed a gap.

## 4. The 4 UI Phases

**Phase 5.1: The Application Shell (Foundation)**

* **Goal**: Create the "Terminal Window" frame.
* **Components**:
  * `AppLayout`: CSS Grid layout with a Collapsible Sidebar.
  * `Sidebar`: Navigation links (Library, Dashboard, Review).
  * **WebTUI Setup**: Configuring `@layer base, utils, components` and importing the CSS.

**Phase 5.2: The Library (The IDE)**

* **Goal**: Knowledge Management (CRUD).
* **Features**:
  * **Recursive Tree**: Visualizing `Topic > Subtopic > Problem`.
  * **Markdown Editor**: Writing content with live preview.
  * **Toolbar**: "Add Child", "Delete", "Link Theory".

**Phase 5.3: The Study Session (Focus Mode)**

* **Goal**: The Flashcard Loop.
* **Layout**: Distraction-free (Sidebar hidden).
* **Flow**:
    1. **Prompt**: Show Question (LaTeX rendered).
    2. **Input**: Large Textarea (CodeMirror) for solving.
    3. **Reveal**: Show Solution + Grading Bar (FSRS).
    4. **Reflection**: "Why did I miss this?" Modal.

**Phase 5.4: The Dashboard (Analytics)**

* **Goal**: Motivation & Entry.
* **Widgets**: Heatmap, "Due Now" Count, "Critical Gaps" List.
