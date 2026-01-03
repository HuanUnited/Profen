# Block 5.2 - Updated Planning & Technical Debt Resolution

## Block 5.1 Reality Check & Delta Analysis

**Original Block 5.1** (Block-5.1-Notes.txt): Focused on grid views + basic CRUD
**Delivered Block 5.1**: Full navigation + context menus + smart creation

**Key Changes Impacting 5.2+**:

```
1. Context menus NOW → Leaf views get Edit/Delete
2. NodeModal context-aware → Associations fit naturally  
3. Browser nav → Study sessions need history awareness
4. Custom scrollbars → Consistent across all views
```

## Technical Debt Clearance Plan

| Debt                      | Priority         | Resolution                | Effort |
| ------------------------- | ---------------- | ------------------------- | ------ |
| NodeModal associations    | **HIGH**   | Add relations UI (next)   | 4h     |
| Problem/TheoryView menus  | **MEDIUM** | Copy context menu pattern | 2h     |
| Real mastery %            | **MEDIUM** | FSRS queries per node     | 3h     |
| Keyboard context triggers | **LOW**    | Ctrl+Shift+N = Create     | 1h     |

## Updated Block 5.2 Scope

### **Phase 5.2: Leaf Node Views (Problem/Theory/Term)**

#### **1. ProblemView.tsx** `Attempt History + Study Entry`

```
HEADER: "Calc/Integration → Definite Integral" (breadcrumbs)
MAIN:
├── Description (markdown + LaTeX)
├── Related nodes (associations grid)
├── Attempt history table:
│   ├── # | Grade | Time | Answer | Errors | Date
│   └── Red badges for unresolved errors
│   └── Success streak (3/3 → gold)
FOOTER:
├── "Study Now" → AttemptModal
└── Right-click background → Edit
```

#### **2. TheoryView.tsx** `Reference + Variants`

```
HEADER: "Integration → Fundamental Theorem"
MAIN:
├── Theory body (markdown)
├── Variants/Related theories (associations)
├── Testing problems (defines/tests rels)
FOOTER:
├── No "Study" (passive reference)
└── Right-click → Edit
```

#### **3. AttemptModal.tsx** `Timed Study Session`

```
TIMER: 30s countdown (server-side)
INPUT: User answer (text + optional code)
SUBMIT: Grade selector (1=Again, 4=Easy)
FEEDBACK: FSRS grade + fluency penalty
→ Records attempt + schedules next review
```

## Block 5.3: NodeModal Associations

```
RELATIONS UI (inside modal):
├── Search + dropdown: "Definite Integral" "tests" "Riemann Sum"
├── Add → List: [x] Definite Integral tests Riemann Sum
├── Visual graph preview (react-flow mini)
└── Save → Backend NodeAssociation.Create() w/ constraint swap
```

## Revised Block Timeline

| Block         | Original       | Revised w/ 5.1 Changes          |
| ------------- | -------------- | ------------------------------- |
| **5.2** | Leaf views     | ✅ Leaf views + AttemptModal    |
| **5.3** | NodeModal v2   | ✅ Associations + graph preview |
| **5.4** | Mastery system | ✅ Real FSRS % + badges         |
| **5.5** | Search/Sort    | ✅ Multi-field + mastery sort   |
| **6.1** | Study session  | ✅ Timer + FSRS integration     |

## Accommodations for Block 5.1 Changes

### **1. Navigation Integration**

```
All new views get:
- useNavigationHistory() → Alt+←/→
- Background context menu → Edit/Create
- Consistent header patterns
```

### **2. Context-Aware Flows**

```
Study Now (ProblemView):
→ AttemptModal(contextNode=problem)
→ Auto-links to current topic/subject

Edit (any view):
→ NodeModal(mode="edit", initialNode)
→ Preserves hierarchy context
```

### **3. Visual Consistency**

```
All views inherit:
- Custom scrollbars
- Color-coded borders (blue=problem, purple=theory)
- Mastery bars (fake → real in 5.4)
```

## Implementation Priority (Next 24h)

```
🚀 IMMEDIATE (Block 5.2 Kickoff):
1. ProblemView.tsx + basic attempt table
2. TheoryView.tsx + associations grid  
3. Copy context menu pattern to leaves

🔧 TECHNICAL DEBT:
4. NodeModal relations dropdown
5. FSRS mastery queries (mock → real)

🎨 POLISH:
6. Breadcrumbs in leaf headers
7. Attempt history sorting (date/grade)
```

## File Structure Update

```
src/components/views/
├── 📁 navigation/           # 5.1
│   ├── LibrarySidebar.tsx
│   └── useNavigationHistory.ts
├── 📁 views/                # 5.1
│   ├── RootView.tsx
│   ├── SubjectView.tsx
│   └── TopicView.tsx
├── 📁 smart/                # 5.1+
│   ├── ContextMenu.tsx
│   └── NodeModal.tsx (needs associations)
└── 📁 views/leaf/           # 5.2 NEW
    ├── ProblemView.tsx
    ├── TheoryView.tsx
    └── AttemptModal.tsx
```

## Success Metrics (Block 5.2)

```
✅ User can Study → Problem → AttemptModal → Grade → FSRS update
✅ Right-click Problem → Edit associations → Save
✅ Mastery bars show real % + color (gold/red)
✅ Alt+←/→ + Up nav works in leaf views
✅ Zero console errors
```

**Block 5.1 changes made the system more modular and UX-complete.** Block 5.2 now builds directly atop the navigation/context foundation without rework.
