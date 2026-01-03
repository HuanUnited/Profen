# **Block 8 - Implementation Documentation**

## **Completed Work**

### **1. FSRS Backend Implementation (Complete ✅)**

#### **Services Created:**

- `internal/app/service/fsrs.go`
  - FSRS v4.5 algorithm implementation
  - Review card processing for mature cards
  - Graduation logic for cards completing learning steps
  - Next interval prediction for all 4 grades (Again, Hard, Good, Easy)
  - **Critical Bug Fixed**: Interval calculation formula corrected to `I = S × 9 × (1/R - 1)`

- `internal/app/service/learningsteps.go`
  - Learning steps pipeline (default: 10m, 30m)
  - Relearning steps for failed reviews (default: 10m)
  - Graduation interval logic (1 day default, 4 days for Easy)
  - State management: New → Learning → Review
  - Relearning state for lapsed cards

- `internal/app/service/coordinator.go`
  - Unified review coordinator routing between Learning Steps and FSRS
  - Determines which service handles a card based on state
  - Provides scheduling info for all 4 grade buttons

#### **Configuration:**

```go
LearningStepsConfig {
  LearningSteps:      []int{10, 30}  // minutes
  RelearningSteps:    []int{10}
  GraduatingInterval: 1               // days
  EasyInterval:       4               // days
}

FSRSConfig {
  DesiredRetention: 0.9
  MaxInterval:      36500  // ~100 years
  W:                [17]float64  // FSRS v4.5 weights
}
```

#### **Wails Bindings Added to `app.go`:**

```go
func (a *App) ReviewCard(nodeIDStr string, grade int, durationMs int, userAnswer string) error
func (a *App) GetSchedulingInfo(nodeIDStr string) (map[int]string, error)
```

***

### **2. Database Schema & Repositories (Complete ✅)**

#### **Ent Schema Updates:**

- `FsrsCard` entity with all FSRS fields:
  - `card_state` (enum: new, learning, review, relearning)
  - `current_step` (for learning progression)
  - `stability`, `difficulty`, `reps`, `lapses`
  - `scheduled_days`, `elapsed_days`
  - `next_review` timestamp
  
- `Attempt` entity for session history:
  - Rating (1-4 FSRS grade)
  - Duration (milliseconds)
  - User answer (text + JSON metadata)
  - Snapshot of card state at time of review

#### **Repositories:**

- `data/attempt_repository.go` - Attempt CRUD and statistics
- `data/stats_repository.go` - Dashboard aggregates
- `data/mastery_service.go` - Mastery calculations

#### **Hooks:**

- `hooks/fsrs_card_init.go` - Auto-creates FSRS card on Node creation
- `hooks/node_closure.go` - Maintains hierarchy closure table

***

### **3. Testing & Validation (Complete ✅)**

#### **Test Suites:**

- `service/fsrs_test.go` (9 tests)
  - Graduate card initialization
  - Review card stability increase
  - Relearning transitions
  - Difficulty adjustments
  - Interval predictions

- `service/learningsteps_test.go` (6 tests)
  - New card progression
  - Learning step advancement
  - Grade "Again" resets
  - Easy graduation
  - Relearning mechanics

- `service/coordinator_test.go` (4 tests)
  - New → Learning → Review flow
  - Service routing logic
  - Scheduling info retrieval

- `data/dictionary_test.go` - Dual node creation with FSRS cards
- `data/hooks_test.go` - FSRS card auto-initialization

#### **Test Fixes:**

- Fixed elapsed days calculation (handled early/overdue reviews)
- Corrected learning step expectations (step 0 → step 1 on first Good)
- Updated coordinator tests with proper two-step learning config
- Fixed foreign key cleanup order (Attempts → FsrsCards)

**Test Coverage:** 61.2% of service layer statements

***

### **4. Frontend Infrastructure (Complete ✅)**

#### **Components:**

- `AttemptModal.tsx` - Current modal-based review interface
  - Timer with millisecond precision
  - 4-grade FSRS buttons
  - Error logging for failed attempts
  - 1-10 difficulty rating (star system)
  - Metadata capture (errorLog, userDifficultyRating, submittedAt)

#### **Current Limitations:**

- Uses **hardcoded intervals** (not fetching from backend)
- No visual card state indicator
- Modal approach (not full-page session)
- No queue support
- No session persistence

***

## **Identified Issues & Decisions**

### **Issue 1: Card State Not Visible in Frontend**

**Problem:** `ent.Node` returned by `GetNode()` doesn't include associated `FsrsCard` data (state, current_step, intervals).

**Solution:** Create `GetNodeWithCard(nodeId)` backend function that JOINs Node + FsrsCard data.

```go
// Proposed app.go addition
func (a *App) GetNodeWithCard(nodeIDStr string) (map[string]interface{}, error) {
  node, _ := a.nodeRepo.GetNode(a.ctx, nodeID)
  card, _ := a.client.FsrsCard.Query().Where(fsrscard.NodeID(nodeID)).Only(a.ctx)
  
  return map[string]interface{}{
    "node": node,
    "card_state": card.CardState,
    "current_step": card.CurrentStep,
    "next_review": card.NextReview,
    "stability": card.Stability,
    "difficulty": card.Difficulty,
  }, nil
}
```

***

### **Issue 2: Session Persistence**

**Decision:** Study sessions will persist if user closes app mid-session.

**Implementation:**

- Store session state in `localStorage`:

  ```typescript
  {
    queue: ["id1", "id2", "id3"],
    currentIndex: 1,
    startTime: 1704297600000,
    returnTo: "/library?nodeId=X"
  }
  ```

- On Study layout mount, check for saved session and offer resume
- Clear on completion or explicit exit

***

### **Issue 3: Queue Generation**

**Decision:** "Review All Problems" will sort by due date (oldest first).

**Implementation:** Create `GetDueCardsFromSubject(subjectId, limit)` backend function.

```go
func (a *App) GetDueCardsFromSubject(subjectIDStr string, limit int) ([]*ent.Node, error) {
  // 1. Get all descendant problems via node_closure
  // 2. JOIN with fsrs_cards
  // 3. WHERE next_review <= NOW()
  // 4. ORDER BY next_review ASC
  // 5. LIMIT
}
```

***

## **Next Implementation Plan**

### **Phase 1: Backend - Card State Fetching**

#### **Task 1.1: Create GetNodeWithCard Function**

**File:** `internal/app/app.go`

```go
func (a *App) GetNodeWithCard(nodeIDStr string) (map[string]interface{}, error) {
  id, _ := uuid.Parse(nodeIDStr)
  node, err := a.nodeRepo.GetNode(a.ctx, id)
  if err != nil { return nil, err }
  
  card, err := a.client.FsrsCard.Query().
    Where(fsrscard.NodeID(id)).
    Only(a.ctx)
  if err != nil { return nil, err }
  
  return map[string]interface{}{
    "id": node.ID.String(),
    "title": node.Title,
    "body": node.Body,
    "type": node.Type,
    "card_state": card.CardState,
    "current_step": card.CurrentStep,
    "next_review": card.NextReview,
    "stability": card.Stability,
    "difficulty": card.Difficulty,
    "reps": card.Reps,
    "lapses": card.Lapses,
  }, nil
}
```

#### **Task 1.2: Create Queue Generation Functions**

**File:** `internal/app/app.go`

```go
// Get due cards from entire library
func (a *App) GetDueCardsQueue(limit int) ([]string, error) {
  cards, err := a.suggestionRepo.GetDueCards(a.ctx, limit)
  if err != nil { return nil, err }
  
  ids := make([]string, len(cards))
  for i, card := range cards {
    ids[i] = card.ID.String()
  }
  return ids, nil
}

// Get due cards from specific subject/topic
func (a *App) GetDueCardsFromNode(parentIDStr string, limit int) ([]string, error) {
  parentID, _ := uuid.Parse(parentIDStr)
  
  // 1. Query node_closure to get all descendants
  descendants, _ := a.client.NodeClosure.Query().
    Where(nodeclosure.AncestorID(parentID)).
    QueryDescendant().
    Where(node.TypeIn(node.TypeProblem, node.TypeTheory)).
    All(a.ctx)
  
  // 2. Filter to only due cards, sorted by next_review
  var dueNodeIDs []string
  for _, desc := range descendants {
    card, err := a.client.FsrsCard.Query().
      Where(
        fsrscard.NodeID(desc.ID),
        fsrscard.NextReviewLTE(time.Now()),
      ).
      Only(a.ctx)
    
    if err == nil {
      dueNodeIDs = append(dueNodeIDs, card.NodeID.String())
    }
  }
  
  // 3. Sort by next_review (oldest first) - needs separate query
  // 4. Limit results
  if len(dueNodeIDs) > limit {
    dueNodeIDs = dueNodeIDs[:limit]
  }
  
  return dueNodeIDs, nil
}
```

***

### **Phase 2: Frontend - Study Layout**

#### **Task 2.1: Create Study Layout Component**

**File:** `frontend/src/components/layouts/Study.tsx`

**Features:**

- Queue state management
- Progress tracker (3/10)
- Auto-advance on grade submission
- Session persistence (localStorage)
- Auto-return to origin on completion

**Structure:**

```tsx
Study.tsx
├── useStudySession.ts (Custom hook for queue logic)
├── StudyHeader.tsx (Progress bar, exit button)
├── StudyContent.tsx (Problem display + answer panel)
└── StudyGrading.tsx (4-grade buttons with intervals)
```

#### **Task 2.2: Update Routing**

**File:** `frontend/src/routes.tsx`

```tsx
{
  path: "/study",
  element: <Shell sidebar={null} />,
  children: [
    { path: "", element: <Study /> }
  ]
}
```

#### **Task 2.3: Modify ProblemView to Navigate**

**File:** `frontend/src/components/views/ProblemView.tsx`

**Change:**

```tsx
// Before:
const [isAttemptOpen, setIsAttemptOpen] = useState(false);
<AttemptModal isOpen={isAttemptOpen} onClose={...} node={node} />

// After:
const navigate = useNavigate();
const handleAttempt = () => {
  const returnPath = `/library?nodeId=${node.id}`;
  navigate(`/study?queue=${node.id}&returnTo=${encodeURIComponent(returnPath)}`);
};
<StyledButton onClick={handleAttempt}>Attempt Problem</StyledButton>
```

***

### **Phase 3: Enhanced Study UX**

#### **Task 3.1: Session Resume Prompt**

- On `/study` mount, check `localStorage` for saved session
- Show resume modal if found
- Options: "Resume" or "Start Fresh"

#### **Task 3.2: Completion Summary**

- Before auto-return, show session stats:
  - Total cards reviewed
  - Session duration
  - Accuracy breakdown (Again/Hard/Good/Easy counts)
- "Return to Dashboard" button

#### **Task 3.3: Keyboard Shortcuts**

- `1` = Again
- `2` = Hard
- `3` = Good
- `4` = Easy
- `Esc` = Exit session (with confirmation)

#### **Task 3.4: Visual State Indicator**

**In Study Layout Header:**

```tsx
<StateBadge state="Learning" step={1} totalSteps={2} />
// Renders: "LEARNING • Step 2/2"
```

***

### **Phase 4: Dashboard Integration**

#### **Task 4.1: "Start Daily Review" Button**

**File:** `frontend/src/components/layouts/Dashboard.tsx`

```tsx
const handleStartReview = async () => {
  const queueIds = await GetDueCardsQueue(20);
  if (queueIds.length === 0) {
    toast.info("No cards due for review!");
    return;
  }
  navigate(`/study?queue=${queueIds.join(",")}&returnTo=/`);
};
```

#### **Task 4.2: Due Count Display**

- Show "15 cards due" in Dashboard
- Fetch from `GetDueCards(1000).length` (just count)

***

## **File Changes Summary**

### **Backend (Go)**

| File | Action | Description |
|------|--------|-------------|
| `internal/app/app.go` | **Modify** | Add `GetNodeWithCard`, `GetDueCardsQueue`, `GetDueCardsFromNode` |
| `internal/app/service/fsrs.go` | ✅ Complete | FSRS algorithm (bug fixed) |
| `internal/app/service/learningsteps.go` | ✅ Complete | Learning pipeline |
| `internal/app/service/coordinator.go` | ✅ Complete | Review routing |

### **Frontend (React + TypeScript)**

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/routes.tsx` | **Modify** | Add `/study` route |
| `frontend/src/components/layouts/Study.tsx` | **Create** | Main study session container |
| `frontend/src/components/smart/StudyHeader.tsx` | **Create** | Progress bar and exit button |
| `frontend/src/components/smart/StudyContent.tsx` | **Create** | Problem display + answer input |
| `frontend/src/components/smart/StudyGrading.tsx` | **Create** | Grade buttons with intervals |
| `frontend/src/utils/hooks/useStudySession.ts` | **Create** | Queue management hook |
| `frontend/src/components/views/ProblemView.tsx` | **Modify** | Replace modal trigger with navigation |
| `frontend/src/components/layouts/Dashboard.tsx` | **Modify** | Add "Start Review" button |
| `frontend/src/components/smart/AttemptModal.tsx` | **Deprecate** | Will be replaced by Study layout |

***

## **Testing Plan**

### **Backend Tests (Go)**

- [ ] `TestGetNodeWithCard` - Verify JOIN logic and data completeness
- [ ] `TestGetDueCardsQueue` - Verify sorting by next_review
- [ ] `TestGetDueCardsFromNode` - Verify descendant filtering

### **Frontend Tests (Manual for now)**

- [ ] Single problem flow: Library → Study → Grade → Return to Library
- [ ] Queue flow: Dashboard → Study → Grade 5 cards → Return to Dashboard
- [ ] Session persistence: Start queue → Close app → Reopen → Resume prompt
- [ ] Completion summary: Finish queue → See stats → Auto-return
- [ ] Keyboard shortcuts: Grade using 1/2/3/4 keys

***

## **Open Questions**

1. **Should "Easy" button skip remaining learning steps?**
   - Current: Yes (graduates immediately with 4-day interval)
   - Alternative: Only skip current step, not all remaining steps

2. **Should relearning steps be shown in UI?**
   - Current plan: Show "RELEARNING -  Step 1/1"
   - Alternative: Just show "RELEARNING" without step count

3. **Session timeout policy?**
   - If user resumes after 24 hours, should intervals be recalculated?
   - Or use intervals calculated at session start?

***

## **Estimated Timeline**

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Phase 1: Backend | 3 functions | 1-2 hours |
| Phase 2: Frontend Core | Study layout + routing | 3-4 hours |
| Phase 3: UX Enhancements | Session resume, completion screen | 2-3 hours |
| Phase 4: Dashboard | Start review button, due count | 1 hour |
| **Total** | | **7-10 hours** |

***

## **Success Criteria**

✅ User can click "Attempt Problem" in Library and review a single card  
✅ User can start a review session from Dashboard with 20 due cards  
✅ Study session persists across app restarts  
✅ Card state (New/Learning/Review) is visible during study  
✅ Learning step progress is shown (Step 1/2)  
✅ Intervals on grade buttons reflect actual FSRS calculations  
✅ Session completion shows statistics before returning  
✅ Keyboard shortcuts work for grading (1/2/3/4)  
