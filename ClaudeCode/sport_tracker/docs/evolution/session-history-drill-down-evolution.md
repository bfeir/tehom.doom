# session-history-drill-down — Evolution Archive

**Feature**: Session history list with drill-down
**Delivered**: 2026-05-07
**Steps**: 2 | **Tests added**: 8 new active tests | **Commits**: 2

## Changes

### 01-01: Create SessionList accordion component
- New `SessionList` component replaces flat-table ExerciseHistory view
- One card per session: date + exercise count
- Click to expand — shows all entries (exerciseName, sets×reps, form quality)
- Only one session expanded at a time (mutual exclusion)
- Empty state handled
- BEM CSS in history.css (.session-list, .session-list__card, etc.)

### 01-02: Wire SessionList into HistoryPage
- `main.tsx` HistoryPage now renders `<SessionList>` instead of `<ExerciseHistory>`
- ExerciseHistory.tsx kept intact (still available for other uses)
- Data flow unchanged: useExerciseHistory → Session[] → SessionList

## Files Modified
- src/components/SessionList.tsx (new)
- src/styles/history.css (extended)
- src/main.tsx (import swapped)
- tests/unit/components/SessionList.test.tsx (new)
- tests/unit/components/HistoryPage.test.tsx (new)
